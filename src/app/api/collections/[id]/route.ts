import '@/lib/polyfill';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Collection from '@/models/Collection';
import { getUserFromSession } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    const { name, description, gradient } = await request.json();

    const collection = await Collection.findById(id);
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return NextResponse.json({ error: 'Collection name cannot be empty' }, { status: 400 });
      }
      const slug = trimmedName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      const slugExists = await Collection.findOne({ slug, _id: { $ne: id } }).lean();
      if (slugExists) {
        return NextResponse.json({ error: 'A collection with this name already exists' }, { status: 409 });
      }
      collection.name = trimmedName;
      collection.slug = slug;
    }
    if (description !== undefined) {
      collection.description = description.trim();
    }
    if (gradient !== undefined) {
      const targetGradient = gradient.trim();
      if (!targetGradient) {
        return NextResponse.json({ error: 'Color gradient cannot be empty' }, { status: 400 });
      }
      collection.gradient = targetGradient;
    }

    await collection.save();
    return NextResponse.json({ message: 'Collection updated', collection });
  } catch (error: unknown) {
    console.error('Update collection error:', error);
    return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const collection = await Collection.findByIdAndDelete(id);
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Collection deleted' });
  } catch (error: unknown) {
    console.error('Delete collection error:', error);
    return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 });
  }
}
