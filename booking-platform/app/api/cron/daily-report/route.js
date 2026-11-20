import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function cleanDigits(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function formatINR(amount) {
  if (!amount || isNaN(Number(amount))) return '₹0';
  return '₹' + Number(amount).toLocaleString('en-IN');
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date'); // Optional YYYY-MM-DD
    const sendEmail = searchParams.get('send_email') !== 'false';

    // 1. Verify Vercel Cron Secret if configured in production
    const authHeader = req.headers.get('authorization');
    if (
      process.env.CRON_SECRET &&
      authHeader &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // 2. Connect to Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Determine target date in IST (UTC+5:30)
    let targetDateStr = '';
    let startOfTodayUTC;
    let endOfTodayUTC;
    let displayDateStr = '';

    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      targetDateStr = dateParam;
      startOfTodayUTC = new Date(`${targetDateStr}T00:00:00+05:30`);
      endOfTodayUTC = new Date(`${targetDateStr}T23:59:59.999+05:30`);
      displayDateStr = startOfTodayUTC.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } else {
      const now = new Date();
      // If triggered after midnight (e.g. 12:15 AM IST), offset by -2 hours to attribute to the calendar day that just ended
      const adjustedTime = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istTime = new Date(adjustedTime.getTime() + istOffset);
      
      const year = istTime.getUTCFullYear();
      const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
      const day = String(istTime.getUTCDate()).padStart(2, '0');
      targetDateStr = `${year}-${month}-${day}`;

      startOfTodayUTC = new Date(`${targetDateStr}T00:00:00+05:30`);
      endOfTodayUTC = new Date(`${targetDateStr}T23:59:59.999+05:30`);

      displayDateStr = startOfTodayUTC.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }

    // 4. Query all submissions for this calendar day in IST
    const { data: rawBookings, error } = await supabase
      .from('bookings')
      .select('id, client_name, client_phone, client_email, event_type, event_date, venue, city, state, budget, booking_source, source_form, notes, status, created_at')
      .gte('created_at', startOfTodayUTC.toISOString())
      .lte('created_at', endOfTodayUTC.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const bookings = rawBookings || [];
    const rawTotalCount = bookings.length;

    // 5. Deduplicate submissions by phone number / client identity (Count strictly as a single lead)
    const leadMap = new Map();

    for (const b of bookings) {
      const phone = cleanDigits(b.client_phone);
      // Key by 10-digit phone if present, otherwise valid email, otherwise unique id
      const key = phone && phone.length === 10
        ? `phone:${phone}`
        : (b.client_email && b.client_email.includes('@') && !b.client_email.includes('example.com')
            ? `email:${b.client_email.toLowerCase().trim()}`
            : `id:${b.id}`);

      if (!leadMap.has(key)) {
        leadMap.set(key, {
          id: b.id,
          client_name: b.client_name || 'Event Host',
          client_phone: b.client_phone || '',
          cleanPhone: phone,
          client_email: b.client_email || '',
          event_type: b.event_type || 'Live Performance',
          event_date: b.event_date,
          venue: b.venue || '',
          city: b.city || 'Flexible / Pan-India',
          state: b.state || '',
          budget: Number(b.budget) || 0,
          booking_source: b.booking_source || b.source_form || 'Website Inquiry',
          created_at: b.created_at,
          repeatCount: 1,
          allSources: [b.booking_source || b.source_form || 'Website Inquiry'],
        });
      } else {
        const lead = leadMap.get(key);
        lead.repeatCount += 1;
        lead.allSources.push(b.booking_source || b.source_form || 'Website Inquiry');

        // Prefer highest budget across submissions
        const curBudget = Number(b.budget) || 0;
        if (curBudget > lead.budget) {
          lead.budget = curBudget;
        }

        // Prefer actual name over generic "Event Host"
        if ((!lead.client_name || lead.client_name === 'Event Host') && b.client_name && b.client_name !== 'Event Host') {
          lead.client_name = b.client_name;
        }

        // Prefer specific city over generic "India" or "All Cities"
        if ((!lead.city || lead.city === 'India' || lead.city === 'All Cities') && b.city && b.city !== 'India' && b.city !== 'All Cities') {
          lead.city = b.city;
        }

        // Keep most descriptive event type
        if ((!lead.event_type || lead.event_type === 'Live Performance') && b.event_type && b.event_type !== 'Live Performance') {
          lead.event_type = b.event_type;
        }
      }
    }

    const uniqueLeads = Array.from(leadMap.values());
    const uniqueCount = uniqueLeads.length;

    // 6. Aggregate Analytics strictly on unique deduplicated leads
    let totalPipelineBudget = 0;
    const cityCounts = {};
    const categoryCounts = {};

    uniqueLeads.forEach((lead) => {
      if (lead.budget > 0) {
        totalPipelineBudget += lead.budget;
      }

      const city = (lead.city || 'Flexible / Pan-India').trim();
      cityCounts[city] = (cityCounts[city] || 0) + 1;

      const category = (lead.event_type || 'General Live Act').trim();
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    const topCities = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const uniqueCitiesCount = Object.keys(cityCounts).length;
    const topActName = topCategories[0] ? topCategories[0][0] : 'Live Music';

    // 7. Build Deduplicated Lead Rows for HTML Email
    const rowsHtml = uniqueLeads
      .map((lead, idx) => {
        const phone = lead.cleanPhone;
        const name = lead.client_name && lead.client_name !== 'Event Host' ? lead.client_name : 'Event Host';
        const city = lead.city || 'Pan-India';
        const eventType = lead.event_type || 'Live Performance';
        const eventDate = lead.event_date
          ? new Date(lead.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          : 'Flexible Date';
        const budgetText = lead.budget > 0 ? formatINR(lead.budget) : 'Custom Quote';
        const timeStr = new Date(lead.created_at).toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        const source = lead.booking_source;

        const waLink = phone
          ? `https://wa.me/91${phone}?text=${encodeURIComponent(
              `Hi ${name}, thank you for contacting Magnevents regarding your ${eventType} in ${city}!`
            )}`
          : null;

        const repeatBadge = lead.repeatCount > 1
          ? `<span style="display: inline-block; background-color: #fef3c7; color: #b45309; padding: 2px 7px; border-radius: 9999px; font-size: 10px; font-weight: 700; border: 1px solid #fde68a; margin-top: 3px;">
              ⚡ Submitted ${lead.repeatCount}x (Deduplicated)
            </span>`
          : '';

        return `
          <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
            <td style="padding: 12px 14px; font-size: 13px; color: #1e293b; font-weight: 600;">
              <div>${escapeHtml(name)}</div>
              <div style="font-size: 11px; color: #64748b; font-weight: 400; margin-top: 2px;">
                🕐 ${escapeHtml(timeStr)} IST
              </div>
              ${repeatBadge}
            </td>
            <td style="padding: 12px 14px; font-size: 13px; color: #0f172a;">
              ${
                phone
                  ? `<div>
                      <a href="tel:+91${phone}" style="color: #2563eb; text-decoration: none; font-weight: 600;">+91 ${phone}</a>
                      ${
                        waLink
                          ? `<a href="${waLink}" target="_blank" style="display: inline-block; margin-left: 6px; padding: 2px 7px; background-color: #22c55e; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 10px; font-weight: bold;">WhatsApp ↗</a>`
                          : ''
                      }
                    </div>`
                  : `<span style="color: #94a3b8;">No phone</span>`
              }
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                📍 ${escapeHtml(city)}
              </div>
            </td>
            <td style="padding: 12px 14px; font-size: 13px; color: #1e293b;">
              <div style="font-weight: 600; color: #0f172a;">${escapeHtml(eventType)}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                📅 ${escapeHtml(eventDate)}
              </div>
            </td>
            <td style="padding: 12px 14px; font-size: 13px; font-weight: 700; color: #059669; text-align: right;">
              <div>${escapeHtml(budgetText)}</div>
              <div style="font-size: 10px; color: #64748b; font-weight: 400; margin-top: 2px; text-overflow: ellipsis; overflow: hidden; max-width: 140px;">
                ${escapeHtml(source)}
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    const topCitiesHtml = topCities
      .map(
        ([c, cCount]) =>
          `<span style="display: inline-block; background-color: #f1f5f9; color: #334155; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-right: 6px; margin-bottom: 6px;">
            ${escapeHtml(c)}: <b>${cCount}</b>
          </span>`
      )
      .join('');

    const topCategoriesHtml = topCategories
      .map(
        ([cat, catCount]) =>
          `<span style="display: inline-block; background-color: #f1f5f9; color: #334155; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-right: 6px; margin-bottom: 6px;">
            ${escapeHtml(cat)}: <b>${catCount}</b>
          </span>`
      )
      .join('');

    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.magnevents.in';

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daily Unique Submission Report</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px 12px; color: #0f172a;">
        <div style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%); padding: 32px 28px; text-align: left; color: #ffffff;">
            <div style="display: inline-block; background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(8px); padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">
              Executive Daily Briefing • Deduplicated
            </div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; color: #ffffff;">
              Daily Form Submissions Report
            </h1>
            <p style="margin: 6px 0 0 0; font-size: 14px; color: #cbd5e1;">
              📅 ${escapeHtml(displayDateStr)} • 11:55 PM IST Dispatch
            </p>
          </div>

          <!-- Key Metrics Grid -->
          <div style="padding: 24px 28px 12px 28px;">
            <table style="width: 100%; border-collapse: separate; border-spacing: 12px 0;">
              <tr>
                <td style="width: 25%; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px 12px; text-align: center;">
                  <div style="font-size: 28px; font-weight: 900; color: #1d4ed8; line-height: 1;">${uniqueCount}</div>
                  <div style="font-size: 11px; font-weight: 700; color: #3b82f6; text-transform: uppercase; margin-top: 6px;">Unique Leads</div>
                  <div style="font-size: 10px; color: #64748b; margin-top: 2px;">(${rawTotalCount} total forms)</div>
                </td>
                <td style="width: 25%; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px 12px; text-align: center;">
                  <div style="font-size: 20px; font-weight: 900; color: #047857; line-height: 1.2;">${formatINR(totalPipelineBudget)}</div>
                  <div style="font-size: 11px; font-weight: 700; color: #10b981; text-transform: uppercase; margin-top: 4px;">Pipeline Value</div>
                  <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Deduplicated</div>
                </td>
                <td style="width: 25%; background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 16px 12px; text-align: center;">
                  <div style="font-size: 28px; font-weight: 900; color: #7e22ce; line-height: 1;">${uniqueCitiesCount}</div>
                  <div style="font-size: 11px; font-weight: 700; color: #a855f7; text-transform: uppercase; margin-top: 6px;">Active Cities</div>
                  <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Target Markets</div>
                </td>
                <td style="width: 25%; background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 16px 12px; text-align: center;">
                  <div style="font-size: 14px; font-weight: 800; color: #c2410c; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(topActName)}</div>
                  <div style="font-size: 11px; font-weight: 700; color: #f97316; text-transform: uppercase; margin-top: 6px;">Top Category</div>
                  <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Highest Demand</div>
                </td>
              </tr>
            </table>
          </div>

          <!-- Market Distribution Breakdown -->
          <div style="padding: 12px 28px 20px 28px;">
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px;">
              <div style="margin-bottom: 12px;">
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 6px;">
                  📍 Geographic Distribution (${uniqueCitiesCount} Cities)
                </div>
                <div>${topCitiesHtml || '<span style="font-size: 12px; color: #94a3b8;">None</span>'}</div>
              </div>
              <div>
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 6px;">
                  🎯 In-Demand Categories
                </div>
                <div>${topCategoriesHtml || '<span style="font-size: 12px; color: #94a3b8;">None</span>'}</div>
              </div>
            </div>
          </div>

          <!-- Individual Submissions Table -->
          <div style="padding: 0 28px 24px 28px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <h3 style="margin: 0; font-size: 15px; font-weight: 800; color: #0f172a;">
                📋 Unique Verified Leads (${uniqueCount})
              </h3>
            </div>
            
            <div style="border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden;">
              <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                  <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                    <th style="padding: 10px 14px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569;">Client</th>
                    <th style="padding: 10px 14px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569;">Contact & City</th>
                    <th style="padding: 10px 14px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569;">Requirement</th>
                    <th style="padding: 10px 14px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569; text-align: right;">Budget & Source</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml || '<tr><td colspan="4" style="padding: 24px; text-align: center; color: #94a3b8; font-size: 13px;">No form submissions recorded for this date.</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Direct Call to Action -->
          <div style="padding: 0 28px 32px 28px; text-align: center;">
            <a href="${adminUrl}/dashboard/requests" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 14px; font-weight: 700; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);">
              👉 Open Magnevents Admin Portal
            </a>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 28px; text-align: center; font-size: 11px; color: #94a3b8;">
            This automated executive dossier is generated every day at 11:55 PM IST by Magnevents Core Engine.<br>
            Duplicates from the same phone/client are grouped into a single verified lead.<br>
            Magnevents Inc. • Live Artist & Entertainment Platform
          </div>

        </div>
      </body>
      </html>
    `;

    // 8. Send Email via Nodemailer if enabled
    let emailSent = false;
    let emailRecipient = process.env.EMAIL_USER || 'magneventsdotin@gmail.com';
    let cleanPass = (process.env.EMAIL_PASS || '').replace(/['"]/g, '').trim();

    if (sendEmail && emailRecipient && cleanPass) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailRecipient.replace(/['"]/g, '').trim(),
          pass: cleanPass,
        },
      });

      await transporter.sendMail({
        from: `"Magnevents Daily Report" <${emailRecipient}>`,
        to: emailRecipient,
        subject: `📊 Daily Form Submissions: ${uniqueCount} Unique Leads (${displayDateStr})`,
        html: htmlBody,
      });
      emailSent = true;
    }

    return NextResponse.json({
      success: true,
      uniqueCount,
      rawTotalCount,
      totalPipelineBudget,
      date: displayDateStr,
      targetDate: targetDateStr,
      emailSent,
      sentTo: emailRecipient,
      topCities,
      topCategories,
    });
  } catch (error) {
    console.error('Daily cron report error:', error);
    return NextResponse.json(
      { error: 'Failed to process daily report', message: error?.message || String(error) },
      { status: 500 }
    );
  }
}
