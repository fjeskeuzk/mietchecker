// API route for geocoding addresses
import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress } from '@/lib/osm';

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address || typeof address !== 'string') {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const result = await geocodeAddress(address);

    if (!result) {
      return NextResponse.json(
        { error: 'Could not find coordinates for this address' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
