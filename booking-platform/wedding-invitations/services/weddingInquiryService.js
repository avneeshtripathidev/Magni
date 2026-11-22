/**
 * Wedding Invitation Inquiry Service (Frontend Client Service)
 * Handles client submission, validation, and error states for wedding invitations.
 */

export async function submitWeddingInquiry(payload) {
  // Client-side quick validation - Only 10-digit mobile number required
  const errors = {};
  const cleanPhone = (payload.phone || '').replace(/[^0-9]/g, '');
  if (!cleanPhone || cleanPhone.length < 10) {
    errors.phone = 'Please provide a valid 10-digit WhatsApp or mobile number.';
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      validationErrors: errors,
      error: 'Please enter a valid 10-digit phone number.'
    };
  }

  const safePayload = {
    ...payload,
    customer_name: (payload.customer_name || '').trim() || 'Wedding Host',
    phone: cleanPhone,
    whatsapp: cleanPhone,
    invitation_type: payload.invitation_type || 'Digital Wedding Card',
    design_category: payload.design_category || 'Royal Wedding Invitations',
    budget: payload.budget || 'Standard Package',
    wedding_date: payload.wedding_date || null,
    requirements: payload.requirements || (payload.selected_design_name ? `Requested Design: ${payload.selected_design_name}` : 'WhatsApp Catalog & Preview Request')
  };

  try {
    const response = await fetch('/api/wedding-inquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(safePayload),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to submit wedding inquiry. Please try again.',
      };
    }

    return {
      success: true,
      inquiryId: data.inquiryId,
      message: data.message || 'Your inquiry has been successfully submitted!',
      data: data.data,
    };
  } catch (err) {
    console.error('[WeddingInquiryService] Network submission error:', err);
    return {
      success: false,
      error: 'Network connection issue. Please check your internet or reach us directly on WhatsApp.',
    };
  }
}
