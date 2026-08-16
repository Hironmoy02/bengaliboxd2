'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/hooks';
import api from '@/lib/axios';
import {
  Box, Typography, Button, Paper, Stack, TextField, Tab, Tabs, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Avatar, Chip, IconButton, Switch,
  Divider, Card, CardContent, InputAdornment,
  Autocomplete, useMediaQuery, useTheme,
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CheckIcon from '@mui/icons-material/Check';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import YouTubeIcon from '@mui/icons-material/YouTube';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  AppAlert, AppConfirmModal, AppLoadingState, AppEmptyState, AppYearPicker,
} from '@/components/ui';
import { CHANNELS, GENRES, NARRATOR_KEYWORDS, ADMIN_TAB_LABELS, YOUTUBE_THUMBNAIL, matchYouTubeChannel, SUGGESTED_TAGS, formatDuration } from '@/lib/constants';

interface Story { _id: string; title: string; channel: string; narrator: string; genre: string; writer?: string; youtubeId: string; youtubeUrl: string; approved: boolean; duration?: number; tags?: string[]; description?: string; thumbnailUrl?: string; yearPublished?: number; }
interface UserProfile { _id: string; username: string; email: string; role: string; createdAt: string; }
interface TrafficStat { date: string; visitors: number; }
interface AdminStats { totalUsers: number; adminUsers: number; approvedStories: number; pendingStories: number; totalReviews: number; }

const COLOR_PALETTE = [
  '#4f46e5', '#7c3aed', '#db2777', '#ec4899', '#f43f5e', '#ef4444',
  '#f97316', '#ea580c', '#d97706', '#f59e0b', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#2563eb',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#f97316', '#b91c1c',
  '#0f766e', '#9a3412', '#7f1d1d', '#dc2626', '#e11d48', '#0891b2',
  '#7e22ce', '#475569', '#64748b', '#1d4ed8', '#059669', '#ea580c',
];

const DEFAULT_COLORS = { color1: '#4f46e5', color2: '#7c3aed', color3: '#db2777' };

function generateTriColorGradient(c1: string, c2: string, c3: string): string {
  return `linear-gradient(135deg, ${c1} 0%, ${c2} 50%, ${c3} 100%)`;
}

function parseGradientColors(gradient: string): { color1: string; color2: string; color3: string } {
  const hexMatches = gradient.match(/#[0-9a-fA-F]{3,8}/g);
  if (hexMatches && hexMatches.length >= 3) {
    return { color1: hexMatches[0], color2: hexMatches[1], color3: hexMatches[2] };
  }
  if (hexMatches && hexMatches.length === 2) {
    return { color1: hexMatches[0], color2: hexMatches[0], color3: hexMatches[1] };
  }
  return DEFAULT_COLORS;
}

function getErrorMessage(err: unknown): string { return err instanceof Error ? err.message : 'An error occurred'; }

export default function AdminPage() {
  const { user, loading } = useAppSelector((s) => s.auth);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = useState(0);

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [title, setTitle] = useState('');
  const [channel, setChannel] = useState('Sunday Suspense');
  const [narrator, setNarrator] = useState('');
  const [genre, setGenre] = useState('Horror');
  const [writer, setWriter] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [writers, setWriters] = useState<{ _id: string; name: string }[]>([]);
  const [yearPublished, setYearPublished] = useState('');
  const [duration, setDuration] = useState<number>(0);
  const [tags, setTags] = useState<string[]>([]);

  const [isFetchingYoutube, setIsFetchingYoutube] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [traffic, setTraffic] = useState<TrafficStat[]>([]);
  const [pendingStories, setPendingStories] = useState<Story[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const filteredUsers = usersList.filter((u) => {
    const q = userSearch.toLowerCase();
    return !q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [allowUserSubmissions, setAllowUserSubmissions] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; message: string; action: () => void; severity: 'error' | 'warning' }>({ open: false, title: '', message: '', action: () => { }, severity: 'warning' });

  const [editSearch, setEditSearch] = useState('');
  const [editResults, setEditResults] = useState<Story[]>([]);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [editForm, setEditForm] = useState({ title: '', channel: '', narrator: '', genre: '', writer: '', description: '', thumbnailUrl: '', yearPublished: '', youtubeUrl: '', duration: 0, tags: [] as string[] });
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [loadingAllStories, setLoadingAllStories] = useState(false);
  const [editingPendingStory, setEditingPendingStory] = useState<Story | null>(null);
  const [pendingEditForm, setPendingEditForm] = useState({ title: '', channel: '', narrator: '', genre: '', writer: '', description: '', thumbnailUrl: '', yearPublished: '', youtubeUrl: '', duration: 0, tags: [] as string[] });
  const [savingPendingEdit, setSavingPendingEdit] = useState(false);

  interface FeedbackItem { _id: string; userId: { username: string; email: string }; category: string; message: string; status: string; createdAt: string; }
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [feedbackTotalPages, setFeedbackTotalPages] = useState(1);
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState('');

  const [bulkCsvText, setBulkCsvText] = useState('');
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResults, setBulkResults] = useState<{ total: number; success: number; failed: number; results: { row: number; title: string; status: 'success' | 'failed'; error?: string }[] } | null>(null);

  const [bulkSubTab, setBulkSubTab] = useState(0);
  const [migrateUploading, setMigrateUploading] = useState(false);
  const [migrateResults, setMigrateResults] = useState<{ total: number; created: number; updated: number; unchanged: number; failed: number; results: { row: number; title: string; status: 'created' | 'updated' | 'unchanged' | 'failed'; error?: string }[] } | null>(null);

  interface CollectionItem { _id: string; name: string; slug: string; description: string; gradient: string; storyIds: string[]; storyCount: number; createdAt: string; }
  interface CollectionStory { _id: string; title: string; channel: string; narrator: string; writer?: string; youtubeId: string; thumbnailUrl?: string; averageRating?: number; ratingsCount?: number; duration?: number; isInCollection: boolean; }
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [collectionName, setCollectionName] = useState('');
  const [collectionDesc, setCollectionDesc] = useState('');
  const [collectionColor1, setCollectionColor1] = useState(DEFAULT_COLORS.color1);
  const [collectionColor2, setCollectionColor2] = useState(DEFAULT_COLORS.color2);
  const [collectionColor3, setCollectionColor3] = useState(DEFAULT_COLORS.color3);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<CollectionItem | null>(null);
  const [collectionStorySearch, setCollectionStorySearch] = useState('');
  const [collectionStories, setCollectionStories] = useState<CollectionStory[]>([]);
  const [loadingCollectionStories, setLoadingCollectionStories] = useState(false);
  const [editColName, setEditColName] = useState('');
  const [editColDesc, setEditColDesc] = useState('');
  const [editColColor1, setEditColColor1] = useState(DEFAULT_COLORS.color1);
  const [editColColor2, setEditColColor2] = useState(DEFAULT_COLORS.color2);
  const [editColColor3, setEditColColor3] = useState(DEFAULT_COLORS.color3);
  const [updatingCol, setUpdatingCol] = useState(false);

  const channelsList = [...CHANNELS];
  const genresList = [...GENRES];

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

  const fetchStats = async () => {
    if (!user || user.role !== 'admin') return;
    setLoadingStats(true);
    try { const { data } = await api.get('/api/admin/stats'); setStats(data.metrics); setTraffic(data.traffic || []); }
    catch { console.error('Failed to load stats'); }
    finally { setLoadingStats(false); }
  };

  const fetchPendingStories = async () => {
    if (!user || user.role !== 'admin') return;
    setLoadingPending(true);
    try { const { data } = await api.get('/api/stories', { params: { status: 'pending' } }); setPendingStories(data.stories || []); }
    catch { console.error('Failed to load pending stories'); }
    finally { setLoadingPending(false); }
  };

  const fetchUsers = async () => {
    if (!user || user.role !== 'admin') return;
    setLoadingUsers(true);
    try { const { data } = await api.get('/api/admin/users'); setUsersList(data.users || []); }
    catch { console.error('Failed to load users'); }
    finally { setLoadingUsers(false); }
  };

  const fetchSettings = async () => {
    if (!user || user.role !== 'admin') return;
    setLoadingSettings(true);
    try { const { data } = await api.get('/api/admin/settings'); setAllowUserSubmissions(data.settings.allowUserSubmissions); }
    catch { console.error('Failed to load settings'); }
    finally { setLoadingSettings(false); }
  };

  const fetchAllStories = async () => {
    if (!user || user.role !== 'admin') return;
    setLoadingAllStories(true);
    try {
      const { data } = await api.get('/api/stories', { params: { status: 'all', limit: 500 } });
      setAllStories(data.stories || []);
    } catch { console.error('Failed to load stories'); }
    finally { setLoadingAllStories(false); }
  };

  const fetchFeedbacks = async () => {
    if (!user || user.role !== 'admin') return;
    setLoadingFeedback(true);
    try {
      const params: Record<string, string | number> = { page: feedbackPage };
      if (feedbackStatusFilter) params.status = feedbackStatusFilter;
      const { data } = await api.get('/api/feedback', { params });
      setFeedbacks(data.feedbacks || []);
      setFeedbackTotalPages(data.pagination?.totalPages || 1);
    } catch { console.error('Failed to load feedback'); }
    finally { setLoadingFeedback(false); }
  };

  const fetchCollections = async () => {
    if (!user || user.role !== 'admin') return;
    setLoadingCollections(true);
    try {
      const { data } = await api.get('/api/collections');
      setCollections(data.collections || []);
    } catch { console.error('Failed to load collections'); }
    finally { setLoadingCollections(false); }
  };

  const handleCreateCollection = async () => {
    if (!collectionName.trim()) return;
    setCreatingCollection(true);
    try {
      const gradient = generateTriColorGradient(collectionColor1, collectionColor2, collectionColor3);
      const { data } = await api.post('/api/collections', { name: collectionName, description: collectionDesc, gradient });
      setSuccess(data.message || 'Collection created!');
      setCollectionName('');
      setCollectionDesc('');
      setCollectionColor1(DEFAULT_COLORS.color1);
      setCollectionColor2(DEFAULT_COLORS.color2);
      setCollectionColor3(DEFAULT_COLORS.color3);
      fetchCollections();
    } catch (err) { setError(getErrorMessage(err) || 'Failed to create collection'); }
    finally { setCreatingCollection(false); }
  };

  const handleUpdateCollection = async () => {
    if (!selectedCollection || !editColName.trim()) return;
    setUpdatingCol(true);
    setError('');
    setSuccess('');
    try {
      const gradient = generateTriColorGradient(editColColor1, editColColor2, editColColor3);
      const { data } = await api.put(`/api/collections/${selectedCollection._id}`, {
        name: editColName,
        description: editColDesc,
        gradient,
      });
      setSuccess(data.message || 'Collection updated!');
      setSelectedCollection(data.collection);
      fetchCollections();
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to update collection');
    } finally {
      setUpdatingCol(false);
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    setConfirmModal({
      open: true, title: 'Delete Collection', message: 'This will permanently delete this collection.', severity: 'error', action: async () => {
        setError(''); setSuccess(''); setActionInProgress(collectionId);
        try {
          await api.delete(`/api/collections/${collectionId}`);
          setSuccess('Collection deleted');
          if (selectedCollection?._id === collectionId) setSelectedCollection(null);
          fetchCollections();
        } catch (err) { setError(getErrorMessage(err) || 'Failed to delete collection'); }
        finally { setActionInProgress(null); setConfirmModal((p) => ({ ...p, open: false })); }
      }
    });
  };

  const fetchCollectionStories = async (collectionId: string, search: string) => {
    setLoadingCollectionStories(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const { data } = await api.get(`/api/collections/${collectionId}/stories`, { params });
      setCollectionStories(data.stories || []);
    } catch { console.error('Failed to load collection stories'); }
    finally { setLoadingCollectionStories(false); }
  };

  const handleAddStoryToCollection = async (collectionId: string, storyId: string) => {
    try {
      await api.post(`/api/collections/${collectionId}/stories`, { storyId });
      fetchCollectionStories(collectionId, collectionStorySearch);
      fetchCollections();
    } catch (err) { setError(getErrorMessage(err) || 'Failed to add story'); }
  };

  const handleRemoveStoryFromCollection = async (collectionId: string, storyId: string) => {
    try {
      await api.delete(`/api/collections/${collectionId}/stories`, { data: { storyId } });
      fetchCollectionStories(collectionId, collectionStorySearch);
      fetchCollections();
    } catch (err) { setError(getErrorMessage(err) || 'Failed to remove story'); }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    if (activeTab === 0) fetchStats();
    if (activeTab === 1) fetchPendingStories();
    if (activeTab === 2) fetchUsers();
    if (activeTab === 4) fetchAllStories();
    if (activeTab === 6) fetchCollections();
    if (activeTab === 7) fetchSettings();
  }, [activeTab, user]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    if (activeTab === 8) fetchFeedbacks();
  }, [activeTab, user, feedbackPage, feedbackStatusFilter]);

  useEffect(() => { if (user && user.role !== 'admin') { Promise.resolve().then(() => setActiveTab(3)); } }, [user]);

  useEffect(() => {
    api.get('/api/writers').then(({ data }) => setWriters(data.writers || [])).catch(() => { });
  }, []);


  const handleSearchStories = async () => {
    if (!editSearch.trim()) return;
    setLoadingEdit(true);
    try {
      const { data } = await api.get('/api/stories', { params: { search: editSearch, status: 'all', limit: 50 } });
      setEditResults(data.stories || []);
    } catch { console.error('Failed to search stories'); }
    finally { setLoadingEdit(false); }
  };

  const handleFetchYoutube = async () => {
    if (!youtubeUrl) { setError('Enter a YouTube URL first'); return; }
    setError(''); setSuccess(''); setIsFetchingYoutube(true);
    try {
      const { data } = await api.get('/api/youtube-fetch', { params: { url: youtubeUrl } });
      setTitle(data.title);
      const matchedChannel = matchYouTubeChannel(data.channel || '');
      setChannel(matchedChannel || 'Other Bengali Channels');
      setDescription(data.description || '');
      setThumbnailUrl(data.thumbnailUrl || '');
      if (data.yearPublished) setYearPublished(String(data.yearPublished));
      if (data.duration) setDuration(data.duration);
      if (data.writer) setWriter(data.writer);
      if (data.narrator) {
        setNarrator(data.narrator);
      } else {
        const t = data.title.toLowerCase();
        const matchedNarrator = Object.entries(NARRATOR_KEYWORDS).find(([kw]) => t.includes(kw));
        setNarrator(matchedNarrator ? matchedNarrator[1] : '');
      }
      setSuccess('Successfully fetched YouTube story details!');
    } catch (err) { setError(getErrorMessage(err) || 'Failed to query YouTube API'); }
    finally { setIsFetchingYoutube(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !channel || !youtubeUrl || !narrator) { setError('Fill out all required fields'); return; }
    setError(''); setSuccess(''); setIsSubmitting(true);
    try {
      if (writer.trim()) {
        const trimmed = writer.trim();
        if (!writers.some((w) => w.name.toLowerCase() === trimmed.toLowerCase())) {
          try {
            const { data } = await api.post('/api/writers', { name: trimmed });
            if (data.writer) setWriters((prev) => {
              const updated = [...prev, data.writer];
              return updated.sort((a, b) => a.name.localeCompare(b.name));
            });
          } catch { /* writer already exists or error */ }
        }
      }
      const { data } = await api.post('/api/stories', { title, channel, youtubeUrl, narrator, genre, writer, description, thumbnailUrl, yearPublished, duration: duration || undefined, tags });
      setSuccess(data.message || 'Story added!');
      // Refresh writers list to ensure new writers appear
      api.get('/api/writers').then(({ data: wData }) => setWriters(wData.writers || [])).catch(() => {});
      setYoutubeUrl(''); setTitle(''); setNarrator(''); setWriter(''); setYearPublished(''); setDescription(''); setThumbnailUrl(''); setDuration(0); setTags([]);
      if (user?.role === 'admin') fetchStats();
    } catch (err) { setError(getErrorMessage(err) || 'Error saving story.'); }
    finally { setIsSubmitting(false); }
  };

  const handleApproveStory = async (storyId: string) => {
    setConfirmModal({
      open: true, title: 'Approve Story', message: 'This story will be published to the public lobby.', severity: 'warning', action: async () => {
        setError(''); setSuccess(''); setActionInProgress(storyId);
        try { const { data } = await api.post(`/api/stories/${storyId}/approve`); setSuccess(data.message); fetchPendingStories(); }
        catch (err) { setError(getErrorMessage(err) || 'Failed to approve story'); }
        finally { setActionInProgress(null); setConfirmModal((p) => ({ ...p, open: false })); }
      }
    });
  };

  const handleRejectStory = async (storyId: string) => {
    setConfirmModal({
      open: true, title: 'Reject & Delete Story', message: 'This will permanently delete this story suggestion. This action cannot be undone.', severity: 'error', action: async () => {
        setError(''); setSuccess(''); setActionInProgress(storyId);
        try { const { data } = await api.delete(`/api/stories/${storyId}/approve`); setSuccess(data.message); fetchPendingStories(); }
        catch (err) { setError(getErrorMessage(err) || 'Failed to delete story'); }
        finally { setActionInProgress(null); setConfirmModal((p) => ({ ...p, open: false })); }
      }
    });
  };

  const handleEditPendingStory = (story: Story) => {
    setEditingPendingStory(story);
    setPendingEditForm({
      title: story.title,
      channel: story.channel,
      narrator: story.narrator,
      genre: story.genre,
      writer: story.writer || '',
      description: story.description || '',
      thumbnailUrl: story.thumbnailUrl || '',
      yearPublished: story.yearPublished ? String(story.yearPublished) : '',
      youtubeUrl: story.youtubeUrl || '',
      duration: story.duration || 0,
      tags: story.tags || [],
    });
  };

  const handleSavePendingEdit = async () => {
    if (!editingPendingStory) return;
    setSavingPendingEdit(true);
    try {
      const payload: Record<string, unknown> = {};
      if (pendingEditForm.title) payload.title = pendingEditForm.title;
      if (pendingEditForm.channel) payload.channel = pendingEditForm.channel;
      if (pendingEditForm.narrator) payload.narrator = pendingEditForm.narrator;
      if (pendingEditForm.genre) payload.genre = pendingEditForm.genre;
      if (pendingEditForm.writer !== undefined) payload.writer = pendingEditForm.writer;
      if (pendingEditForm.description !== undefined) payload.description = pendingEditForm.description;
      if (pendingEditForm.thumbnailUrl !== undefined) payload.thumbnailUrl = pendingEditForm.thumbnailUrl;
      if (pendingEditForm.yearPublished) payload.yearPublished = pendingEditForm.yearPublished;
      if (pendingEditForm.youtubeUrl) payload.youtubeUrl = pendingEditForm.youtubeUrl;
      if (pendingEditForm.duration) payload.duration = String(pendingEditForm.duration);
      payload.tags = pendingEditForm.tags;
      const { data } = await api.put(`/api/stories/${editingPendingStory._id}`, payload);
      setSuccess(data.message || 'Story updated!');
      setEditingPendingStory(null);
      fetchPendingStories();
    } catch (err) { setError(getErrorMessage(err) || 'Failed to update story'); }
    finally { setSavingPendingEdit(false); }
  };

  const handlePromoteUser = async (targetUserId: string, username: string) => {
    setConfirmModal({
      open: true, title: 'Promote to Admin', message: `Promote '${username}' to Admin? They will have full admin access.`, severity: 'warning', action: async () => {
        setError(''); setSuccess(''); setActionInProgress(targetUserId);
        try { const { data } = await api.post('/api/admin/users', { userId: targetUserId }); setSuccess(data.message); fetchUsers(); }
        catch (err) { setError(getErrorMessage(err) || 'Failed to promote user'); }
        finally { setActionInProgress(null); setConfirmModal((p) => ({ ...p, open: false })); }
      }
    });
  };

  const handleToggleSubmissions = async () => {
    setSavingSettings(true);
    try { const newValue = !allowUserSubmissions; const { data } = await api.put('/api/admin/settings', { allowUserSubmissions: newValue }); setAllowUserSubmissions(data.settings.allowUserSubmissions); setSuccess(`User submissions ${newValue ? 'enabled' : 'disabled'}`); }
    catch (err) { setError(getErrorMessage(err) || 'Failed to update settings'); }
    finally { setSavingSettings(false); }
  };


  const handleUpdateFeedbackStatus = async (feedbackId: string, newStatus: string) => {
    setActionInProgress(feedbackId);
    try {
      const { data } = await api.put(`/api/admin/feedback/${feedbackId}`, { status: newStatus });
      setSuccess(data.message || 'Feedback status updated');
      fetchFeedbacks();
    } catch (err) { setError(getErrorMessage(err) || 'Failed to update feedback'); }
    finally { setActionInProgress(null); }
  };

  const handleBulkUpload = async () => {
    if (!bulkCsvText.trim()) return;
    setBulkUploading(true);
    setBulkResults(null);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.post('/api/stories/bulk', { csv: bulkCsvText }, { timeout: 300000 });
      setBulkResults(data);
      if (data.failed === 0) {
        setSuccess(data.message);
        setBulkCsvText('');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(getErrorMessage(err) || 'Bulk upload failed');
    } finally {
      setBulkUploading(false);
    }
  };

  const handleBulkFileRead = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBulkCsvText(ev.target?.result as string);
      setBulkResults(null);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleMigrateFileRead = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(''); setSuccess(''); setMigrateUploading(true); setMigrateResults(null);
    try {
      const XLSX = await import('xlsx');
      const fileData = await file.arrayBuffer();
      const workbook = XLSX.read(fileData);
      const sheetName = workbook.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      if (rows.length === 0) { setError('Excel file is empty'); setMigrateUploading(false); return; }

      const cols = Object.keys(rows[0] as object);
      const urlCol = cols.find((c) => /link|url|youtube/i.test(c));
      if (!urlCol) { setError('Could not find a YouTube URL column (expected: Link, URL, or YouTube URL)'); setMigrateUploading(false); return; }

      const mappedRows = (rows as any[]).map((row: any) => {
        const r = row as Record<string, any>;
        return {
          title: (r['Title'] || r['title'] || '') as string,
          writer: (r['Writer'] || r['writer'] || '') as string,
          narrator: (r['Narrators'] || r['Narrator'] || r['narrators'] || r['narrator'] || '') as string,
          genre: (r['Genre'] || r['genre'] || '') as string,
          tags: typeof (r['Tags'] || r['tags']) === 'string' ? (r['Tags'] || r['tags'] as string).split(',').map((t: string) => t.trim()).filter(Boolean) : [],
          duration: (r['Duration'] || r['duration'] || r['Duration (HH:MM:SS)'] || '') as number | string,
          year: (r['Year'] || r['year'] || r['year'] || '') as number | string,
          youtubeUrl: (r[urlCol] || '') as string,
        };
      });

      const { data } = await api.post('/api/stories/migrate', { rows: mappedRows }, { timeout: 300000 });
      setMigrateResults(data);
      if (data.failed === 0) setSuccess(data.message);
      else setError(data.message);
    } catch (err) {
      setError(getErrorMessage(err) || 'Migration failed');
    } finally {
      setMigrateUploading(false);
      e.target.value = '';
    }
  };

  const handleSelectStoryForEdit = (story: Story) => {
    setEditingStory(story);
    setEditForm({
      title: story.title,
      channel: story.channel,
      narrator: story.narrator,
      genre: story.genre,
      writer: story.writer || '',
      description: story.description || '',
      thumbnailUrl: story.thumbnailUrl || '',
      yearPublished: story.yearPublished ? String(story.yearPublished) : '',
      youtubeUrl: story.youtubeUrl || '',
      duration: story.duration || 0,
      tags: story.tags || [],
    });
  };

  const handleUpdateStory = async () => {
    if (!editingStory) return;
    setSavingEdit(true);
    try {
      const payload: Record<string, unknown> = {};
      if (editForm.title) payload.title = editForm.title;
      if (editForm.channel) payload.channel = editForm.channel;
      if (editForm.narrator) payload.narrator = editForm.narrator;
      if (editForm.genre) payload.genre = editForm.genre;
      if (editForm.writer !== undefined) payload.writer = editForm.writer;
      if (editForm.description !== undefined) payload.description = editForm.description;
      if (editForm.thumbnailUrl !== undefined) payload.thumbnailUrl = editForm.thumbnailUrl;
      if (editForm.yearPublished) payload.yearPublished = editForm.yearPublished;
      if (editForm.youtubeUrl) payload.youtubeUrl = editForm.youtubeUrl;
      if (editForm.duration) payload.duration = String(editForm.duration);
      payload.tags = editForm.tags;
      const { data } = await api.put(`/api/stories/${editingStory._id}`, payload);
      setSuccess(data.message || 'Story updated!');
      setEditingStory(null);
      handleSearchStories();
    } catch (err) { setError(getErrorMessage(err) || 'Failed to update story'); }
    finally { setSavingEdit(false); }
  };

  const [activeColorPos, setActiveColorPos] = useState(0);

  const renderColorPalette = (
    c1: string, c2: string, c3: string,
    onChange: (color1: string, color2: string, color3: string) => void
  ) => {
    const labels = ['Start', 'Mid', 'End'];
    const currentColors = [c1, c2, c3];

    return (
      <Box sx={{ mb: 2 }}>
        <Box
          sx={{
            width: '100%',
            height: 36,
            borderRadius: 1,
            background: generateTriColorGradient(c1, c2, c3),
            mb: 1.5,
            border: '1px solid',
            borderColor: 'divider',
          }}
        />
        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
          {[0, 1, 2].map((pos) => (
            <Box
              key={pos}
              onClick={() => setActiveColorPos(pos)}
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.75,
                py: 0.75,
                borderRadius: 1,
                cursor: 'pointer',
                border: '2px solid',
                borderColor: activeColorPos === pos ? 'primary.main' : 'divider',
                bgcolor: activeColorPos === pos ? 'action.hover' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: currentColors[pos], border: '1px solid', borderColor: 'divider', flexShrink: 0 }} />
              <Typography variant="caption" sx={{ fontWeight: activeColorPos === pos ? 700 : 500, fontSize: '0.7rem' }}>
                {labels[pos]}
              </Typography>
            </Box>
          ))}
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 0.5 }}>
          {COLOR_PALETTE.map((hex) => {
            const isSelected = currentColors[activeColorPos] === hex;
            return (
              <Box
                key={hex}
                onClick={() => {
                  const newColors = [...currentColors];
                  newColors[activeColorPos] = hex;
                  onChange(newColors[0], newColors[1], newColors[2]);
                }}
                sx={{
                  aspectRatio: '1',
                  borderRadius: 0.5,
                  bgcolor: hex,
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: isSelected ? 'primary.main' : 'transparent',
                  outline: isSelected ? '2px solid rgba(255,94,43,0.4)' : 'none',
                  outlineOffset: 0,
                  transition: 'all 0.1s ease',
                  '&:hover': { transform: 'scale(1.2)', zIndex: 1 },
                }}
              />
            );
          })}
        </Box>
      </Box>
    );
  };

  if (loading || !user) return <AppLoadingState message="Loading admin panel..." fullScreen />;

  const isAdmin = user.role === 'admin';
  const tabLabels = [...ADMIN_TAB_LABELS];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2, py: 5, minHeight: '80vh' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
          {isAdmin ? 'Admin Console' : 'Contributor Desk'}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          {isAdmin ? 'Manage audio stories, review submissions, and view analytics.' : 'Suggest and submit audio stories to keep the catalog up to date!'}
        </Typography>
      </Box>

      {error && <AppAlert severity="error" message={error} onClose={() => setError('')} />}
      {success && <AppAlert severity="success" message={success} onClose={() => setSuccess('')} />}

      {isAdmin && (
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile sx={{ mb: 4, borderBottom: '1px solid', borderColor: 'divider', minHeight: 44, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.9rem' }, minHeight: 44, minWidth: 0, px: { xs: 1, sm: 2 } }, '& .MuiTab-iconWrapper': { mr: { xs: 0.3, sm: 0.5 } } }}>
          {tabLabels.map((label, i) => <Tab key={i} label={label} />)}
        </Tabs>
      )}

      {/* Tab 0: Analytics */}
      {isAdmin && activeTab === 0 && (
        loadingStats ? <AppLoadingState message="Loading analytics..." /> : stats && (
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {[
                { label: 'Active Users', value: stats.totalUsers, icon: <PeopleIcon />, color: 'primary.main' },
                { label: 'Admins', value: stats.adminUsers, icon: <PeopleIcon />, color: 'success.main' },
                { label: 'Stories in Lobby', value: stats.approvedStories, icon: <BarChartIcon />, color: '#f59e0b' },
                { label: 'Pending Approvals', value: stats.pendingStories, icon: <CheckCircleOutlinedIcon />, color: 'error.main' },
              ].map((card) => (
                <Card key={card.label} sx={{ flex: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider', background: 'action.hover' }}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Box sx={{ color: card.color, mb: 1 }}>{card.icon}</Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>{card.label}</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800, mt: 0.5 }}>{card.value}</Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
            <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Traffic (Last 7 Days)</Typography>
              <Stack spacing={1}>
                {traffic.map((day) => (
                  <Stack key={day.date} direction="row" spacing={2} sx={{ alignItems: 'center', py: 1, px: 2, borderRadius: 1, background: 'action.hover' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 100 }}>{day.date}</Typography>
                    <Box sx={{ height: 8, width: Math.min(day.visitors * 15, 200), background: 'primary.main', borderRadius: 1 }} />
                    <Typography variant="caption" color="text.secondary">{day.visitors} visits</Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          </Stack>
        )
      )}

      {/* Tab 1: Approvals */}
      {isAdmin && activeTab === 1 && (
        loadingPending ? <AppLoadingState message="Loading pending stories..." /> : pendingStories.length === 0 ? (
          <AppEmptyState title="All clear!" message="No pending story submissions waiting for approval." />
        ) : (
          <Stack spacing={3}>
            {editingPendingStory && (
              <Paper sx={{ p: 3, border: '1px solid rgba(255,94,43,0.2)' }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Editing: {editingPendingStory.title}</Typography>
                  <Button size="small" onClick={() => setEditingPendingStory(null)}>Cancel</Button>
                </Stack>
                <Stack spacing={2.5}>
                  <TextField fullWidth label="Title" value={pendingEditForm.title} onChange={(e) => setPendingEditForm((p) => ({ ...p, title: e.target.value }))} />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField select slotProps={{ select: { native: true } }} label="Channel" value={pendingEditForm.channel} onChange={(e) => setPendingEditForm((p) => ({ ...p, channel: e.target.value }))} sx={{ flex: 1 }}>
                      {channelsList.map((ch) => <option key={ch} value={ch}>{ch}</option>)}
                    </TextField>
                    <TextField select slotProps={{ select: { native: true } }} label="Genre" value={pendingEditForm.genre} onChange={(e) => setPendingEditForm((p) => ({ ...p, genre: e.target.value }))} sx={{ flex: 1 }}>
                      {genresList.map((g) => <option key={g} value={g}>{g}</option>)}
                    </TextField>
                  </Stack>
                  <TextField fullWidth label="Narrator(s)" value={pendingEditForm.narrator} onChange={(e) => setPendingEditForm((p) => ({ ...p, narrator: e.target.value }))} />
                  <Autocomplete
                    freeSolo
                    options={writers.map((w) => w.name)}
                    value={pendingEditForm.writer}
                    onInputChange={(_, newValue) => setPendingEditForm((p) => ({ ...p, writer: newValue || '' }))}
                    onChange={async (_, newValue) => {
                      if (newValue && !writers.some((w) => w.name.toLowerCase() === newValue.toLowerCase())) {
                        try { const { data } = await api.post('/api/writers', { name: newValue }); if (data.writer) setWriters((prev) => [...prev, data.writer].sort((a, b) => a.name.localeCompare(b.name))); } catch { /* already exists */ }
                      }
                    }}
                    renderInput={(params) => <TextField {...params} label="Writer / Author" fullWidth />}
                    fullWidth
                  />
                  <AppYearPicker value={pendingEditForm.yearPublished} onChange={(y) => setPendingEditForm((p) => ({ ...p, yearPublished: y === 'All' ? '' : y }))} label="Year Published" />
                  {pendingEditForm.duration > 0 && (
                    <Typography variant="caption" color="text.secondary">Duration: <strong>{formatDuration(pendingEditForm.duration)}</strong></Typography>
                  )}
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Tags</Typography>
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                      {SUGGESTED_TAGS.map((tag) => (
                        <Chip key={tag} label={tag} size="small" variant={pendingEditForm.tags.includes(tag) ? 'filled' : 'outlined'} color={pendingEditForm.tags.includes(tag) ? 'primary' : 'default'}
                          onClick={() => setPendingEditForm((p) => ({ ...p, tags: p.tags.includes(tag) ? p.tags.filter((t) => t !== tag) : p.tags.length < 10 ? [...p.tags, tag] : p.tags }))}
                          sx={{ borderColor: 'divider' }} />
                      ))}
                    </Stack>
                  </Box>
                  <TextField fullWidth multiline rows={3} label="Description" value={pendingEditForm.description} onChange={(e) => setPendingEditForm((p) => ({ ...p, description: e.target.value }))} />
                  <Button variant="contained" fullWidth size="large" onClick={handleSavePendingEdit} disabled={savingPendingEdit}>
                    {savingPendingEdit ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Stack>
              </Paper>
            )}

            <Stack spacing={2}>
              {pendingStories.map((story) => (
                <Paper key={story._id} sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', gap: { xs: 1.5, sm: 2 }, alignItems: { xs: 'flex-start', sm: 'center' }, flexWrap: 'wrap', border: '1px solid', borderColor: 'divider' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={YOUTUBE_THUMBNAIL(story.youtubeId)} alt="" style={{ width: isMobile ? 120 : 160, aspectRatio: '16/9', objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: isMobile ? 'calc(100% - 140px)' : 200 }}>
                    <Chip label={story.channel} size="small" color="primary" variant="outlined" sx={{ mb: 0.5 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{story.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Narrator: {story.narrator} &bull; Genre: {story.genre}{story.writer && <>&bull; Writer: {story.writer}</>}
                    </Typography>
                    {story.duration ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Duration: <strong>{formatDuration(story.duration)}</strong>
                      </Typography>
                    ) : null}
                    {story.youtubeUrl && <Button size="small" href={story.youtubeUrl} target="_blank" startIcon={<OpenInNewIcon sx={{ fontSize: 12 }} />} sx={{ mt: 0.5, textTransform: 'none' }}>
                      Play on YouTube
                    </Button>}
                  </Box>
                  <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                    <Button variant="outlined" size="small" startIcon={<EditOutlinedIcon sx={{ fontSize: 14 }} />} onClick={() => handleEditPendingStory(story)} disabled={actionInProgress !== null || editingPendingStory !== null} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Edit
                    </Button>
                    <Button variant="contained" size="small" startIcon={<CheckIcon />} onClick={() => handleApproveStory(story._id)} disabled={actionInProgress !== null} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {actionInProgress === story._id ? 'Working...' : 'Approve'}
                    </Button>
                    <IconButton color="error" size="small" onClick={() => handleRejectStory(story._id)} disabled={actionInProgress !== null}>
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Stack>
        )
      )}

      {/* Tab 2: Users */}
      {isAdmin && activeTab === 2 && (
        <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 1, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Registered Users</Typography>
            <TextField size="small" placeholder="Search..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} fullWidth={isMobile} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> } }} />
          </Stack>
          {loadingUsers ? <AppLoadingState message="Loading users..." /> : filteredUsers.length === 0 ? (
            <AppEmptyState title="No users found" message="Try a different search query." />
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Username</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} className="hide-mobile">Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} className="hide-mobile">Joined</TableCell>
                    <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell><Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: 11 }}>{u.username[0].toUpperCase()}</Avatar><Typography variant="body2" sx={{ fontWeight: 600 }}>{u.username}</Typography></Stack></TableCell>
                      <TableCell className="hide-mobile" color="text.secondary">{u.email}</TableCell>
                      <TableCell><Chip label={u.role} size="small" color={u.role === 'admin' ? 'success' : 'default'} variant={u.role === 'admin' ? 'filled' : 'outlined'} /></TableCell>
                      <TableCell className="hide-mobile" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        {u.role !== 'admin' && (
                          <Button size="small" startIcon={<PersonAddIcon sx={{ fontSize: 14 }} />} onClick={() => handlePromoteUser(u._id, u.username)} disabled={actionInProgress !== null} sx={{ color: 'success.main', borderColor: 'success.main', textTransform: 'none' }} variant="outlined">
                            Make Admin
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            </Box>
          )}
        </Paper>
      )}

      {/* Tab 3: Add Story */}
      {activeTab === 3 && (
        <Stack direction={{ xs: 'column', md: isAdmin ? 'row' : 'column' }} spacing={3}>
          <Paper sx={{ p: 3, flex: 1, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 3 }}>
              <AddIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{isAdmin ? 'Add New Audio Story' : 'Suggest an Audio Story'}</Typography>
            </Stack>
            {!isAdmin && (
              <Paper sx={{ p: 2, mb: 3, background: 'rgba(255,94,43,0.05)', border: '1px solid rgba(255,94,43,0.2)' }}>
                <Typography variant="body2"><strong>Note:</strong> Your suggestion will be saved as pending and reviewed by an admin.</Typography>
              </Paper>
            )}
            <Box sx={{ mb: 3, p: 2, background: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                <YouTubeIcon sx={{ color: 'error.main' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>YouTube Video Link</Typography>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField fullWidth size="small" placeholder="https://www.youtube.com/watch?v=..." value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} />
                <Button variant="outlined" onClick={handleFetchYoutube} disabled={isFetchingYoutube} startIcon={isFetchingYoutube ? <RefreshIcon className="spin-animation" /> : <UploadFileIcon />} sx={{ whiteSpace: 'nowrap' }}>
                  {isFetchingYoutube ? 'Fetching...' : 'Fetch'}
                </Button>
              </Stack>
              {duration > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Duration auto-detected: <strong>{formatDuration(duration)}</strong>
                </Typography>
              )}
            </Box>
            <form onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <TextField fullWidth label="Story Title *" placeholder="e.g. Sunday Suspense | The Hound of the Baskervilles" value={title} onChange={(e) => setTitle(e.target.value)} required />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField select slotProps={{ select: { native: true } }} label="Channel *" value={channel} onChange={(e) => setChannel(e.target.value)} required sx={{ flex: 1 }}>
                    {channelsList.map((ch) => <option key={ch} value={ch}>{ch}</option>)}
                  </TextField>
                  <TextField select slotProps={{ select: { native: true } }} label="Genre *" value={genre} onChange={(e) => setGenre(e.target.value)} required sx={{ flex: 1 }}>
                    {genresList.map((g) => <option key={g} value={g}>{g}</option>)}
                  </TextField>
                </Stack>
                <TextField fullWidth label="Narrator(s) *" placeholder="e.g. Somak, Mir, Deep" value={narrator} onChange={(e) => setNarrator(e.target.value)} required />
                <Autocomplete
                  freeSolo
                  options={writers.map((w) => w.name)}
                  value={writer}
                  onInputChange={(_, newValue) => setWriter(newValue || '')}
                  onChange={async (_, newValue) => {
                    if (newValue && !writers.some((w) => w.name.toLowerCase() === newValue.toLowerCase())) {
                      try {
                        const { data } = await api.post('/api/writers', { name: newValue });
                        if (data.writer) setWriters((prev) => [...prev, data.writer].sort((a, b) => a.name.localeCompare(b.name)));
                      } catch { /* writer already exists or error */ }
                    }
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Writer / Author" placeholder="Type to search or add new writer..." fullWidth />
                  )}
                  fullWidth
                />
                <AppYearPicker
                  value={yearPublished}
                  onChange={(y) => setYearPublished(y === 'All' ? '' : y)}
                  label="Year Published on YouTube"
                />
                {duration > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Duration auto-detected: <strong>{formatDuration(duration)}</strong>
                  </Typography>
                )}
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Tags (optional)</Typography>
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    {SUGGESTED_TAGS.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant={tags.includes(tag) ? 'filled' : 'outlined'}
                        color={tags.includes(tag) ? 'primary' : 'default'}
                        onClick={() => setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 10 ? [...prev, tag] : prev)}
                        sx={{ borderColor: 'divider' }}
                      />
                    ))}
                  </Stack>
                </Box>
                <TextField fullWidth multiline rows={4} label="Description" placeholder="Optional story synopsis..." value={description} onChange={(e) => setDescription(e.target.value)} />
                <TextField fullWidth label="Thumbnail URL" placeholder="Autofilled if YouTube link fetched" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} />
                <Button type="submit" variant="contained" fullWidth size="large" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : isAdmin ? 'Add Story to Database' : 'Submit Story Suggestion'}
                </Button>
              </Stack>
            </form>
          </Paper>
          {isAdmin && (
            <Paper sx={{ p: 3, width: 300, border: '1px solid', borderColor: 'divider', alignSelf: 'flex-start' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Duplicate Checks</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: '0.85rem' }}>
                Bengaliboxd extracts the 11-character YouTube video ID and cross-checks the database to prevent duplicate entries, even if titles vary.
              </Typography>
            </Paper>
          )}
        </Stack>
      )}

      {/* Tab 4: Edit Story */}
      {isAdmin && activeTab === 4 && (
        <Stack spacing={3}>
          <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Search Stories to Edit</Typography>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by title, channel, narrator..."
                value={editSearch}
                onChange={(e) => setEditSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearchStories(); }}
              />
              <Button variant="contained" onClick={handleSearchStories} disabled={loadingEdit}>
                {loadingEdit ? 'Searching...' : 'Search'}
              </Button>
            </Stack>
          </Paper>

          {!editingStory && editResults.length > 0 && (
            <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>{editResults.length} results found</Typography>
              <Stack spacing={1}>
                {editResults.map((story) => (
                  <Paper key={story._id} sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', cursor: 'pointer', border: '1px solid', borderColor: 'divider', '&:hover': { borderColor: 'rgba(255,94,43,0.4)' } }} onClick={() => handleSelectStoryForEdit(story)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={YOUTUBE_THUMBNAIL(story.youtubeId)} alt="" style={{ width: 120, aspectRatio: '16/9', objectFit: 'cover', borderRadius: 8 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{story.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{story.channel} &bull; {story.narrator}</Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                        <Chip label={story.genre} size="small" variant="outlined" />
                        <Chip label={story.approved ? 'Approved' : 'Pending'} size="small" color={story.approved ? 'success' : 'warning'} variant="outlined" />
                      </Stack>
                    </Box>
                    <Button size="small" variant="outlined">Edit</Button>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          )}

          {editingStory && (
            <Paper sx={{ p: 3, border: '1px solid rgba(255,94,43,0.2)' }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Editing: {editingStory.title}</Typography>
                <Button size="small" onClick={() => setEditingStory(null)}>Cancel</Button>
              </Stack>
              <Stack spacing={2.5}>
                <TextField fullWidth label="Title" value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField select slotProps={{ select: { native: true } }} label="Channel" value={editForm.channel} onChange={(e) => setEditForm((p) => ({ ...p, channel: e.target.value }))} sx={{ flex: 1 }}>
                    {channelsList.map((ch) => <option key={ch} value={ch}>{ch}</option>)}
                  </TextField>
                  <TextField select slotProps={{ select: { native: true } }} label="Genre" value={editForm.genre} onChange={(e) => setEditForm((p) => ({ ...p, genre: e.target.value }))} sx={{ flex: 1 }}>
                    {genresList.map((g) => <option key={g} value={g}>{g}</option>)}
                  </TextField>
                </Stack>
                <TextField fullWidth label="Narrator(s)" value={editForm.narrator} onChange={(e) => setEditForm((p) => ({ ...p, narrator: e.target.value }))} />
                <Autocomplete
                  freeSolo
                  options={writers.map((w) => w.name)}
                  value={editForm.writer}
                  onInputChange={(_, newValue) => setEditForm((p) => ({ ...p, writer: newValue || '' }))}
                  onChange={async (_, newValue) => {
                    if (newValue && !writers.some((w) => w.name.toLowerCase() === newValue.toLowerCase())) {
                      try {
                        const { data } = await api.post('/api/writers', { name: newValue });
                        if (data.writer) setWriters((prev) => [...prev, data.writer].sort((a, b) => a.name.localeCompare(b.name)));
                      } catch { /* already exists */ }
                    }
                  }}
                  renderInput={(params) => <TextField {...params} label="Writer / Author" placeholder="Type to search or add new writer..." fullWidth />}
                  fullWidth
                />
                <AppYearPicker
                  value={editForm.yearPublished}
                  onChange={(y) => setEditForm((p) => ({ ...p, yearPublished: y === 'All' ? '' : y }))}
                  label="Year Published"
                />
                {editForm.duration > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Duration: <strong>{formatDuration(editForm.duration)}</strong>
                  </Typography>
                )}
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Tags</Typography>
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    {SUGGESTED_TAGS.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant={editForm.tags.includes(tag) ? 'filled' : 'outlined'}
                        color={editForm.tags.includes(tag) ? 'primary' : 'default'}
                        onClick={() => setEditForm((p) => ({ ...p, tags: p.tags.includes(tag) ? p.tags.filter((t) => t !== tag) : p.tags.length < 10 ? [...p.tags, tag] : p.tags }))}
                        sx={{ borderColor: 'divider' }}
                      />
                    ))}
                  </Stack>
                </Box>
                <Button variant="contained" fullWidth size="large" onClick={handleUpdateStory} disabled={savingEdit}>
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outlined" fullWidth color="error" onClick={() => {
                  if (!editingStory) return;
                  setConfirmModal({
                    open: true, title: 'Delete Story', message: `Permanently delete "${editingStory.title}"?`, severity: 'error', action: async () => {
                      setError(''); setSuccess(''); setActionInProgress(editingStory._id);
                      try { await api.delete(`/api/stories/${editingStory._id}/approve`); setSuccess('Story deleted.'); setEditingStory(null); fetchAllStories(); }
                      catch (err) { setError(getErrorMessage(err) || 'Failed to delete'); }
                      finally { setActionInProgress(null); setConfirmModal((p) => ({ ...p, open: false })); }
                    }
                  });
                }} disabled={actionInProgress === editingStory._id}>
                  Delete Story
                </Button>
              </Stack>
            </Paper>
          )}
        </Stack>
      )}

      {/* Tab 5: Bulk Upload */}
      {isAdmin && activeTab === 5 && (
        <Stack spacing={3}>
          <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
              <UploadFileIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Bulk Upload & Migration</Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />

            <Tabs
              value={bulkSubTab}
              onChange={(_, v) => setBulkSubTab(v)}
              sx={{
                mb: 3,
                minHeight: 36,
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.85rem', minHeight: 36, minWidth: 0, px: 2 },
              }}
            >
              <Tab label="CSV Upload (New Stories)" />
              <Tab label="Excel Migration (Update & Create)" />
            </Tabs>

            {bulkSubTab === 0 && (
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Upload a CSV with columns: <strong>Title, Writer, Narrator, Year, YouTube URL</strong> (and optional <strong>Channel</strong>). If Channel is omitted, it&apos;s auto-detected from YouTube. Only creates new stories — duplicates are rejected.
                </Typography>
                <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
                  Choose CSV File
                  <input type="file" accept=".csv,text/csv" hidden onChange={handleBulkFileRead} />
                </Button>
                <TextField
                  multiline
                  rows={6}
                  fullWidth
                  placeholder={`Title,Writer,Narrator,Year,YouTube URL,Channel\nFeluda - Somoy,Supriya,Deep,2019,https://www.youtube.com/watch?v=...,Sunday Suspense\nKankur,Leela Ganguly,Somak,2018,https://www.youtube.com/watch?v=...`}
                  value={bulkCsvText}
                  onChange={(e) => { setBulkCsvText(e.target.value); setBulkResults(null); }}
                  sx={{ '& textarea': { fontFamily: 'monospace', fontSize: '0.85rem' } }}
                />
                <Button variant="contained" size="large" onClick={handleBulkUpload} disabled={bulkUploading || !bulkCsvText.trim()}>
                  {bulkUploading ? 'Uploading...' : 'Upload Stories'}
                </Button>
              </Stack>
            )}

            {bulkSubTab === 1 && (
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Upload an Excel file with columns: <strong>Title, YouTube URL (or Link), Writer, Narrators, Genre, Tags, Duration, Year</strong>.
                  Existing stories (matched by YouTube URL) will be <strong>updated</strong> with new data. New stories will be <strong>created</strong>.
                  Duration accepts seconds or <strong>HH:MM:SS</strong> format. Tags should be comma-separated.
                </Typography>
                <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} disabled={migrateUploading}>
                  {migrateUploading ? 'Migrating...' : 'Choose Excel File (.xlsx)'}
                  <input type="file" accept=".xlsx,.xls" hidden onChange={handleMigrateFileRead} />
                </Button>
              </Stack>
            )}
          </Paper>

          {bulkSubTab === 0 && bulkResults && (
            <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Upload Results</Typography>
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Chip label={`Total: ${bulkResults.total}`} color="default" />
                <Chip label={`Added: ${bulkResults.success}`} color="success" />
                <Chip label={`Failed: ${bulkResults.failed}`} color={bulkResults.failed > 0 ? 'error' : 'default'} />
              </Stack>
              {bulkResults.results.length > 0 && (
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Row</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Details</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bulkResults.results.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell>{r.row}</TableCell>
                          <TableCell>{r.title}</TableCell>
                          <TableCell>
                            {r.status === 'success'
                              ? <CheckCircleOutlinedIcon sx={{ color: 'success.main', fontSize: 18 }} />
                              : <DeleteOutlinedIcon sx={{ color: 'error.main', fontSize: 18 }} />}
                          </TableCell>
                          <TableCell sx={{ color: r.status === 'failed' ? 'error.main' : 'text.secondary', fontSize: '0.8rem' }}>
                            {r.status === 'failed' ? r.error : 'Added successfully'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          )}

          {bulkSubTab === 1 && migrateResults && (
            <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Migration Results</Typography>
              <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
                <Chip label={`Total: ${migrateResults.total}`} color="default" />
                <Chip label={`Created: ${migrateResults.created}`} color="success" />
                <Chip label={`Updated: ${migrateResults.updated}`} color="info" />
                <Chip label={`Unchanged: ${migrateResults.unchanged}`} color="default" />
                <Chip label={`Failed: ${migrateResults.failed}`} color={migrateResults.failed > 0 ? 'error' : 'default'} />
              </Stack>
              {migrateResults.results.length > 0 && (
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Row</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Details</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {migrateResults.results.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell>{r.row}</TableCell>
                          <TableCell>{r.title}</TableCell>
                          <TableCell>
                            <Chip
                              label={r.status}
                              size="small"
                              color={r.status === 'created' ? 'success' : r.status === 'updated' ? 'info' : r.status === 'failed' ? 'error' : 'default'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell sx={{ color: r.status === 'failed' ? 'error.main' : 'text.secondary', fontSize: '0.8rem' }}>
                            {r.status === 'failed' ? r.error : r.status === 'created' ? 'New story added' : r.status === 'updated' ? 'Existing story updated' : 'No changes needed'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          )}
        </Stack>
      )}

      {/* Tab 6: Collections */}
      {isAdmin && activeTab === 6 && (
        <Stack spacing={3}>
          <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Create Collection</Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={2}>
              <TextField fullWidth size="small" label="Collection Name" placeholder="e.g. Best of Feluda" value={collectionName} onChange={(e) => setCollectionName(e.target.value)} />
              <TextField fullWidth size="small" label="Description (optional)" placeholder="Short description..." value={collectionDesc} onChange={(e) => setCollectionDesc(e.target.value)} />
              {renderColorPalette(collectionColor1, collectionColor2, collectionColor3, (c1, c2, c3) => { setCollectionColor1(c1); setCollectionColor2(c2); setCollectionColor3(c3); })}
              <Button variant="contained" size="large" onClick={handleCreateCollection} disabled={creatingCollection || !collectionName.trim()} sx={{ maxWidth: 200 }}>
                {creatingCollection ? 'Creating...' : 'Create Collection'}
              </Button>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>All Collections</Typography>
            </Stack>
            {loadingCollections ? <AppLoadingState message="Loading collections..." /> : collections.length === 0 ? (
              <AppEmptyState title="No collections yet" message="Create your first collection above." />
            ) : (
              <Stack spacing={2}>
                {collections.map((col) => (
                  <Paper
                    key={col._id}
                    sx={{
                      p: 2,
                      display: 'flex',
                      gap: 2,
                      alignItems: 'center',
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: selectedCollection?._id === col._id ? 'primary.main' : 'divider',
                      '&:hover': { borderColor: 'rgba(255,94,43,0.4)' },
                    }}
                    onClick={() => {
                      setSelectedCollection(col);
                      setCollectionStorySearch('');
                      fetchCollectionStories(col._id, '');
                      setEditColName(col.name);
                      setEditColDesc(col.description || '');
                      const parsed = parseGradientColors(col.gradient);
                      setEditColColor1(parsed.color1);
                      setEditColColor2(parsed.color2);
                      setEditColColor3(parsed.color3);
                    }}
                  >
                    <Box sx={{ width: 48, height: 48, borderRadius: 2, background: col.gradient, flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{col.name}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                        {col.storyCount} {col.storyCount === 1 ? 'story' : 'stories'}
                        {col.description && <> &bull; {col.description}</>}
                      </Typography>
                    </Box>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={(e) => { e.stopPropagation(); handleDeleteCollection(col._id); }}
                      disabled={actionInProgress === col._id}
                    >
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>

          {selectedCollection && (
            <Paper sx={{ p: 3, border: '1px solid rgba(255,94,43,0.2)' }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Manage: {selectedCollection.name}</Typography>
                <Button size="small" onClick={() => setSelectedCollection(null)}>Close</Button>
              </Stack>
              <Box sx={{ mb: 3, p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, background: 'action.hover' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Edit Collection Settings</Typography>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Collection Name"
                    value={editColName}
                    onChange={(e) => setEditColName(e.target.value)}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Description (optional)"
                    placeholder="Short description..."
                    value={editColDesc}
                    onChange={(e) => setEditColDesc(e.target.value)}
                  />
                  {renderColorPalette(editColColor1, editColColor2, editColColor3, (c1, c2, c3) => { setEditColColor1(c1); setEditColColor2(c2); setEditColColor3(c3); })}
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleUpdateCollection}
                    disabled={updatingCol || !editColName.trim()}
                    sx={{ maxWidth: 150 }}
                  >
                    {updatingCol ? 'Saving...' : 'Save Settings'}
                  </Button>
                </Stack>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search stories by title, narrator, writer..."
                  value={collectionStorySearch}
                  onChange={(e) => setCollectionStorySearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') fetchCollectionStories(selectedCollection._id, collectionStorySearch); }}
                />
                <Button variant="contained" onClick={() => fetchCollectionStories(selectedCollection._id, collectionStorySearch)} disabled={loadingCollectionStories}>
                  {loadingCollectionStories ? 'Searching...' : 'Search'}
                </Button>
              </Stack>
              {loadingCollectionStories ? <AppLoadingState message="Searching stories..." /> : collectionStories.length === 0 ? (
                <AppEmptyState title="No stories found" message="Try a different search term." />
              ) : (
                <Stack spacing={1}>
                  {collectionStories.map((story) => (
                    <Paper key={story._id} sx={{ p: 1.5, display: 'flex', gap: 1.5, alignItems: 'center', border: '1px solid', borderColor: 'divider' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={story.thumbnailUrl || YOUTUBE_THUMBNAIL(story.youtubeId)} alt="" style={{ width: 80, aspectRatio: '16/9', objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>{story.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{story.channel} &bull; {story.narrator}</Typography>
                      </Box>
                      {story.isInCollection ? (
                        <Button size="small" variant="outlined" color="error" onClick={() => handleRemoveStoryFromCollection(selectedCollection._id, story._id)}>
                          Remove
                        </Button>
                      ) : (
                        <Button size="small" variant="contained" onClick={() => handleAddStoryToCollection(selectedCollection._id, story._id)}>
                          Add
                        </Button>
                      )}
                    </Paper>
                  ))}
                </Stack>
              )}
            </Paper>
          )}
        </Stack>
      )}

      {/* Tab 7: Settings */}
      {isAdmin && activeTab === 7 && (
        loadingSettings ? <AppLoadingState message="Loading settings..." /> : (
          <Paper sx={{ p: 3, maxWidth: 600, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 3 }}>
              <SettingsIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Contributor Permissions</Typography>
            </Stack>
            <Divider sx={{ mb: 3 }} />
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Allow User Story Submissions</Typography>
                <Typography variant="body2" color="text.secondary">
                  {allowUserSubmissions ? 'Users can suggest stories that appear in Pending Approvals.' : 'Only admins can add stories directly.'}
                </Typography>
              </Box>
              <Switch checked={allowUserSubmissions} onChange={handleToggleSubmissions} disabled={savingSettings} color="primary" />
            </Stack>
          </Paper>
        )
      )}

      {/* Tab 8: Feedback */}
      {isAdmin && activeTab === 8 && (
        <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>User Feedback</Typography>
            <TextField
              select
              size="small"
              value={feedbackStatusFilter}
              onChange={(e) => { setFeedbackStatusFilter(e.target.value); setFeedbackPage(1); }}
              sx={{ width: 180 }}
              slotProps={{ select: { native: true } }}
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="implemented">Implemented</option>
              <option value="dismissed">Dismissed</option>
            </TextField>
          </Stack>
          {loadingFeedback ? <AppLoadingState message="Loading feedback..." /> : feedbacks.length === 0 ? (
            <AppEmptyState title="No feedback" message="No user feedback submissions found." />
          ) : (
            <Stack spacing={2}>
              {feedbacks.map((fb) => (
                <Paper key={fb._id} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 1 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: 11 }}>
                        {fb.userId?.username?.[0]?.toUpperCase() || '?'}
                      </Avatar>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{fb.userId?.username || 'Unknown'}</Typography>
                      {fb.userId?.email && (
                        <Typography variant="caption" color="text.secondary">({fb.userId.email})</Typography>
                      )}
                      <Chip label={fb.category} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">{new Date(fb.createdAt).toLocaleString()}</Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ mb: 1.5, lineHeight: 1.6 }}>{fb.message}</Typography>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Status:</Typography>
                    <Chip label={fb.status} size="small" color={fb.status === 'new' ? 'info' : fb.status === 'reviewed' ? 'warning' : fb.status === 'implemented' ? 'success' : 'default'} sx={{ textTransform: 'capitalize' }} />
                    {fb.status !== 'reviewed' && (
                      <Button size="small" variant="outlined" disabled={actionInProgress === fb._id} onClick={() => handleUpdateFeedbackStatus(fb._id, 'reviewed')}>
                        Mark Reviewed
                      </Button>
                    )}
                    {fb.status !== 'implemented' && (
                      <Button size="small" variant="outlined" color="success" disabled={actionInProgress === fb._id} onClick={() => handleUpdateFeedbackStatus(fb._id, 'implemented')}>
                        Mark Implemented
                      </Button>
                    )}
                    {fb.status !== 'dismissed' && (
                      <Button size="small" variant="outlined" color="error" disabled={actionInProgress === fb._id} onClick={() => handleUpdateFeedbackStatus(fb._id, 'dismissed')}>
                        Dismiss
                      </Button>
                    )}
                  </Stack>
                </Paper>
              ))}
              {feedbackTotalPages > 1 && (
                <Stack direction="row" sx={{ justifyContent: 'center', mt: 2, gap: 1 }}>
                  <Button size="small" disabled={feedbackPage <= 1} onClick={() => setFeedbackPage((p) => p - 1)}>Previous</Button>
                  <Typography variant="body2" sx={{ alignSelf: 'center' }}>Page {feedbackPage} of {feedbackTotalPages}</Typography>
                  <Button size="small" disabled={feedbackPage >= feedbackTotalPages} onClick={() => setFeedbackPage((p) => p + 1)}>Next</Button>
                </Stack>
              )}
            </Stack>
          )}
        </Paper>
      )}

      <AppConfirmModal open={confirmModal.open} title={confirmModal.title} message={confirmModal.message} severity={confirmModal.severity} onConfirm={confirmModal.action} onCancel={() => setConfirmModal((p) => ({ ...p, open: false }))} confirmLabel={confirmModal.severity === 'error' ? 'Delete' : 'Confirm'} />
    </Box>
  );
}
