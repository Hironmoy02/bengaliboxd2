import { processUserGamificationAction, syncUserGamification } from '@/lib/gamification';
import User from '@/models/User';
import Listen from '@/models/Listen';
import Rating from '@/models/Rating';

jest.mock('@/lib/dbConnect', () => jest.fn().mockResolvedValue(true));

jest.mock('@/models/User', () => ({
  findById: jest.fn(),
  deleteModel: jest.fn(),
}));

jest.mock('@/models/Listen', () => ({
  countDocuments: jest.fn().mockResolvedValue(0),
}));

jest.mock('@/models/Rating', () => ({
  countDocuments: jest.fn().mockResolvedValue(0),
  find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
}));

jest.mock('@/models/Like', () => ({
  countDocuments: jest.fn().mockResolvedValue(0),
}));

jest.mock('@/models/Story', () => ({
  countDocuments: jest.fn().mockResolvedValue(0),
}));

describe('Gamification Streak & Daily Login Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function getUtcDateString(date: Date = new Date()): string {
    return date.toISOString().split('T')[0];
  }

  function getYesterdayUtcDateString(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }

  function getTwoDaysAgoUtcDateString(): string {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    return d.toISOString().split('T')[0];
  }

  it('initializes streak to 1 on first login', async () => {
    const mockUser: any = {
      _id: 'user123',
      streak: { current: 0, longest: 0, lastActiveDate: null },
      karmaPoints: 0,
      badges: [],
      save: jest.fn().mockResolvedValue(true),
    };
    (User.findById as jest.Mock).mockResolvedValue(mockUser);

    const result = await processUserGamificationAction('user123', 'LOGIN');

    expect(result).not.toBeNull();
    expect(mockUser.streak.current).toBe(1);
    expect(mockUser.streak.longest).toBe(1);
    expect(mockUser.streak.lastActiveDate).toBe(getUtcDateString());
    expect(mockUser.karmaPoints).toBe(5); // 5 points for LOGIN
    expect(mockUser.save).toHaveBeenCalled();
  });

  it('keeps streak unchanged on same-day login', async () => {
    const todayStr = getUtcDateString();
    const mockUser: any = {
      _id: 'user123',
      streak: { current: 3, longest: 5, lastActiveDate: todayStr },
      karmaPoints: 100,
      badges: [],
      save: jest.fn().mockResolvedValue(true),
    };
    (User.findById as jest.Mock).mockResolvedValue(mockUser);

    const result = await processUserGamificationAction('user123', 'LOGIN');

    expect(result).not.toBeNull();
    expect(mockUser.streak.current).toBe(3);
    expect(mockUser.streak.longest).toBe(5);
    expect(mockUser.streak.lastActiveDate).toBe(todayStr);
  });

  it('increments streak on consecutive daily login', async () => {
    const yesterdayStr = getYesterdayUtcDateString();
    const mockUser: any = {
      _id: 'user123',
      streak: { current: 2, longest: 2, lastActiveDate: yesterdayStr },
      karmaPoints: 50,
      badges: [],
      save: jest.fn().mockResolvedValue(true),
    };
    (User.findById as jest.Mock).mockResolvedValue(mockUser);

    const result = await processUserGamificationAction('user123', 'LOGIN');

    expect(result).not.toBeNull();
    expect(mockUser.streak.current).toBe(3);
    expect(mockUser.streak.longest).toBe(3);
    expect(mockUser.streak.lastActiveDate).toBe(getUtcDateString());
    // Should also unlock streak_3 badge!
    const unlockedStreakBadge = mockUser.badges.find((b: any) => b.badgeId === 'streak_3');
    expect(unlockedStreakBadge).toBeDefined();
  });

  it('resets streak to 1 if user missed a day', async () => {
    const twoDaysAgoStr = getTwoDaysAgoUtcDateString();
    const mockUser: any = {
      _id: 'user123',
      streak: { current: 10, longest: 10, lastActiveDate: twoDaysAgoStr },
      karmaPoints: 200,
      badges: [],
      save: jest.fn().mockResolvedValue(true),
    };
    (User.findById as jest.Mock).mockResolvedValue(mockUser);

    const result = await processUserGamificationAction('user123', 'LOGIN');

    expect(result).not.toBeNull();
    expect(mockUser.streak.current).toBe(1);
    expect(mockUser.streak.longest).toBe(10); // longest preserved
    expect(mockUser.streak.lastActiveDate).toBe(getUtcDateString());
  });

  it('syncUserGamification resets stale streak to 0 if inactive today/yesterday', async () => {
    const twoDaysAgoStr = getTwoDaysAgoUtcDateString();
    const mockUser: any = {
      _id: 'user123',
      streak: { current: 5, longest: 5, lastActiveDate: twoDaysAgoStr },
      karmaPoints: 100,
      badges: [],
      save: jest.fn().mockResolvedValue(true),
    };
    (User.findById as jest.Mock).mockResolvedValue(mockUser);

    await syncUserGamification('user123');

    expect(mockUser.streak.current).toBe(0);
    expect(mockUser.save).toHaveBeenCalled();
  });
});
