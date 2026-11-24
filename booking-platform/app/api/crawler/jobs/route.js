import { NextResponse } from 'next/server';
import { crawlerQueue } from '@/lib/crawler/crawlerQueue.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const jobs = Array.from(crawlerQueue.jobs.values()).reverse();
    return NextResponse.json({
      success: true,
      jobs,
      activeJobId: crawlerQueue.activeJobId
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const jobType = body.jobType || 'custom_search_discovery';
    const city = body.city || 'All Cities';
    const category = body.category || 'All';

    const job = crawlerQueue.createJob(jobType, { city, category });

    // Execute asynchronously without blocking request
    crawlerQueue.runJob(job.id).catch(err => {
      console.error(`Error running crawler job ${job.id}:`, err);
    });

    return NextResponse.json({
      success: true,
      message: `Crawler job ${job.id} initiated`,
      job
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
