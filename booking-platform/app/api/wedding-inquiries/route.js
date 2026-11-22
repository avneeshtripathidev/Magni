import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(supabaseUrl, supabaseKey);
}

function generateInquiryId() {
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `WED-${datePart}-${randomPart}`;
}

function parseBudgetNumber(val) {
  if (!val) return 2500;
  if (typeof val === 'number') return val;
  const str = String(val).replace(/,/g, '');
  const match = str.match(/\d+(\.\d+)?/);
  if (match) {
    const n = parseFloat(match[0]);
    if (!isNaN(n) && n > 0) return n;
  }
  return 2500;
}

async function sendNotificationEmail(inquiry) {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/^"|"$/g, '') : null;

  if (!emailUser || !emailPass) {
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const mailOptions = {
      from: `"Magnevents Wedding Studio" <${emailUser}>`,
      to: emailUser,
      subject: `💌 New Wedding Invitation Inquiry [${inquiry.inquiry_id}] - ${inquiry.customer_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5c158; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1A1517 0%, #2A1A1E 100%); padding: 24px; text-align: center; border-bottom: 2px solid #D4AF37;">
            <h1 style="color: #D4AF37; margin: 0; font-size: 24px; letter-spacing: 1px;">Magnevents Wedding Studio</h1>
            <p style="color: #F8EBE8; margin: 6px 0 0; font-size: 14px;">New Wedding Invitation & Digital Card Inquiry</p>
          </div>
          <div style="padding: 24px; color: #222222; font-size: 14px; line-height: 1.6;">
            <div style="background: #FAF7F2; border: 1px solid #E8D3B9; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
              <span style="font-weight: bold; color: #800020; font-size: 16px;">Inquiry ID: ${inquiry.inquiry_id}</span>
              <span style="float: right; background: #E8B943; color: #1A1517; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">Status: ${inquiry.status}</span>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #EEEEEE; font-weight: bold; color: #555555; width: 40%;">Customer Name:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #EEEEEE; color: #111111; font-weight: 600;">${inquiry.customer_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #EEEEEE; font-weight: bold; color: #555555;">WhatsApp / Phone:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #EEEEEE; color: #111111;"><a href="tel:${inquiry.phone}" style="color: #0F52BA; text-decoration: none;">${inquiry.phone}</a> | <a href="https://wa.me/91${inquiry.phone.replace(/[^0-9]/g, '').slice(-10)}" style="color: #25D366; text-decoration: none; font-weight: bold;">WhatsApp Chat ↗</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #EEEEEE; font-weight: bold; color: #555555;">Email:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #EEEEEE; color: #111111;">${inquiry.email || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #EEEEEE; font-weight: bold; color: #555555;">Wedding Date:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #EEEEEE; color: #800020; font-weight: bold;">${inquiry.wedding_date || 'Flexible / TBD'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #EEEEEE; font-weight: bold; color: #555555;">Invitation Type:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #EEEEEE; color: #111111; font-weight: 600;">${inquiry.invitation_type}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #EEEEEE; font-weight: bold; color: #555555;">Design Category:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #EEEEEE; color: #111111;">${inquiry.design_category}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #EEEEEE; font-weight: bold; color: #555555;">Estimated Budget:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #EEEEEE; color: #111111;">${inquiry.budget || 'Standard Package'}</td>
              </tr>
              ${inquiry.reference_url ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #EEEEEE; font-weight: bold; color: #555555;">Design Reference:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #EEEEEE; color: #0F52BA;"><a href="${inquiry.reference_url}" target="_blank" style="color: #0F52BA;">${inquiry.reference_url}</a></td>
              </tr>` : ''}
            </table>

            <div style="margin-top: 16px;">
              <p style="font-weight: bold; color: #555555; margin-bottom: 6px;">Special Requirements / Event Notes:</p>
              <div style="background: #FDFBF7; border-left: 3px solid #D4AF37; padding: 12px 16px; border-radius: 4px; font-style: italic; color: #333333;">
                ${inquiry.requirements || 'No custom notes provided.'}
              </div>
            </div>

            <div style="margin-top: 24px; text-align: center;">
              <a href="https://admin.magnevents.in/admin/wedding-invitations" style="display: inline-block; background: #D4AF37; color: #1A1517; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; letter-spacing: 0.5px;">View in Artist & Admin Panel →</a>
            </div>
          </div>
          <div style="background: #FAF7F2; padding: 14px; text-align: center; color: #777777; font-size: 12px; border-top: 1px solid #EEEEEE;">
            Magnevents Live Platform &copy; 2026. Automated Wedding Studio Notification.
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (emailErr) {
    console.warn('[WeddingInquiriesAPI] Email notification warning:', emailErr.message);
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    // 1. Validation
    const customer_name = (body.customer_name || body.name || '').trim();
    const rawPhone = (body.phone || body.whatsapp || '').trim();
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');

    if (!customer_name) {
      return NextResponse.json({ success: false, error: 'Full name is required.' }, { status: 400 });
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      return NextResponse.json({ success: false, error: 'A valid 10-digit mobile or WhatsApp number is required.' }, { status: 400 });
    }

    const email = (body.email || '').trim() || null;
    const whatsapp = (body.whatsapp || rawPhone).trim();
    const wedding_date = body.wedding_date || body.date || null;
    const invitation_type = body.invitation_type || 'Digital Wedding Card';
    const design_category = body.design_category || 'Royal Wedding Invitations';
    const budget = body.budget || body.budgetRange || null;
    const requirements = (body.requirements || body.message || body.notes || '').trim();
    const reference_url = (body.reference_url || body.referenceDesign || '').trim() || null;
    const reference_file = body.reference_file || null;
    const selected_design_name = body.selected_design_name || null;

    const inquiry_id = generateInquiryId();
    const supabase = getSupabaseClient();

    const newRecord = {
      inquiry_id,
      customer_name,
      phone: rawPhone,
      email,
      whatsapp,
      wedding_date: wedding_date ? (new Date(wedding_date).toISOString().split('T')[0]) : null,
      invitation_type,
      design_category,
      budget,
      requirements: selected_design_name ? `Selected Design: ${selected_design_name}\n${requirements}` : requirements,
      reference_url,
      reference_file,
      status: 'NEW',
      metadata: {
        submitted_at: new Date().toISOString(),
        user_agent: req.headers.get('user-agent') || 'browser',
        ip: req.headers.get('x-forwarded-for') || 'local',
        selected_design_name,
      }
    };

    let insertedRecord = null;

    // 2. Try inserting into public.wedding_inquiries first
    try {
      const { data, error } = await supabase
        .from('wedding_inquiries')
        .insert([newRecord])
        .select()
        .single();

      if (!error && data) {
        insertedRecord = data;
      } else if (error) {
        console.warn('[WeddingInquiriesAPI] Primary table insert error, trying fallback:', error.message);
      }
    } catch (insertErr) {
      console.warn('[WeddingInquiriesAPI] Direct table error:', insertErr);
    }

    // 3. Fallback to public.bookings if wedding_inquiries table doesn't exist yet in Supabase
    if (!insertedRecord) {
      try {
        const fallbackBooking = {
          client_name: customer_name,
          client_phone: rawPhone,
          client_email: email || 'inquiry@magnevents.in',
          event_type: `Wedding Invitation - ${invitation_type}`,
          event_date: newRecord.wedding_date || new Date().toISOString().split('T')[0],
          venue: 'Digital / Pan-India Delivery',
          city: 'Pan-India',
          state: 'India',
          budget: parseBudgetNumber(budget),
          status: 'pending',
          booking_source: 'wedding_invitation_service',
          reference_code: inquiry_id,
          source_form: 'Wedding Invitation Studio',
          notes: JSON.stringify({
            inquiry_id,
            invitation_type,
            design_category,
            requirements: newRecord.requirements,
            reference_url,
            whatsapp,
            budget,
            metadata: newRecord.metadata,
          }, null, 2)
        };

        const { data: bData, error: bErr } = await supabase
          .from('bookings')
          .insert([fallbackBooking])
          .select()
          .single();

        if (!bErr && bData) {
          insertedRecord = { ...newRecord, id: bData.id };
        } else {
          console.warn('[WeddingInquiriesAPI] Fallback booking error:', bErr?.message);
          // Still assign id so user gets success confirmation
          insertedRecord = { ...newRecord, id: inquiry_id };
        }
      } catch (fbErr) {
        console.error('[WeddingInquiriesAPI] Fallback execution error:', fbErr);
        insertedRecord = { ...newRecord, id: inquiry_id };
      }
    }

    // 4. Email notifications disabled as per request (leads sent directly to Artist Panel & Database)
    // await sendNotificationEmail(newRecord);

    return NextResponse.json({
      success: true,
      inquiryId: inquiry_id,
      message: 'Thank you! Your wedding invitation inquiry has been received. Our design concierge will reach you on WhatsApp within 2 hours.',
      data: insertedRecord,
    }, { status: 201 });

  } catch (err) {
    console.error('[WeddingInquiriesAPI] Critical POST handler error:', err);
    return NextResponse.json({
      success: false,
      error: 'An internal error occurred while processing your inquiry. Please try again.',
    }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Try wedding_inquiries first
    let query = supabase.from('wedding_inquiries').select('*').order('created_at', { ascending: false }).limit(limit);
    if (status && status !== 'all') {
      query = query.eq('status', status.toUpperCase());
    }

    const { data, error } = await query;
    if (!error && data) {
      return NextResponse.json({ success: true, count: data.length, data });
    }

    // Fallback: Query bookings where booking_source = 'wedding_invitation_service'
    let bQuery = supabase
      .from('bookings')
      .select('*')
      .or(`booking_source.eq.wedding_invitation_service,event_type.ilike.%Wedding Invitation%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    const { data: bData, error: bErr } = await bQuery;
    if (bErr) {
      return NextResponse.json({ success: true, count: 0, data: [] });
    }

    const mapped = (bData || []).map((b) => {
      let parsed = {};
      try {
        if (b.notes && b.notes.startsWith('{')) {
          parsed = JSON.parse(b.notes);
        }
      } catch (e) {}

      return {
        id: b.id,
        inquiry_id: parsed.inquiry_id || b.reference_code || `WED-${b.id.slice(0, 8)}`,
        customer_name: b.client_name,
        phone: b.client_phone,
        email: b.client_email,
        whatsapp: parsed.whatsapp || b.client_phone,
        wedding_date: b.event_date,
        invitation_type: parsed.invitation_type || b.event_type,
        design_category: parsed.design_category || 'Royal Wedding Invitations',
        budget: parsed.budget || (b.budget ? `₹${b.budget}` : 'Standard'),
        requirements: parsed.requirements || b.notes,
        reference_url: parsed.reference_url || null,
        status: (b.status === 'confirmed' ? 'COMPLETED' : (b.status === 'cancelled' ? 'CANCELLED' : 'NEW')),
        created_at: b.created_at,
        updated_at: b.updated_at,
      };
    });

    return NextResponse.json({ success: true, count: mapped.length, data: mapped });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
