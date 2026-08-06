import '@/lib/polyfill';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Collection from '@/models/Collection';
import { getUserFromSession } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();
    const collections = await Collection.find({})
      .select('name slug description gradient storyIds createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const results = collections.map((c) => ({
      ...c,
      storyCount: c.storyIds?.length || 0,
    }));

    return NextResponse.json({ collections: results });
  } catch (error: unknown) {
    console.error('Fetch collections error:', error);
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { name, description, gradient } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
    }

    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const exists = await Collection.findOne({ slug }).lean();
    if (exists) {
      return NextResponse.json({ error: 'A collection with this name already exists' }, { status: 409 });
    }

    let targetGradient = (gradient || '').trim();
    if (!targetGradient) {
      targetGradient = 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)';
    }

    const collection = await Collection.create({
      name: name.trim(),
      slug,
      description: description?.trim() || '',
      gradient: targetGradient,
      storyIds: [],
    });

    return NextResponse.json({ message: 'Collection created', collection }, { status: 201 });
  } catch (error: unknown) {
    console.error('Create collection error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create collection' }, { status: 500 });
  }
}
