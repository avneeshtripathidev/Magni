/**
 * Wedding Invitation Inquiry Service (Frontend Client Service)
 * Handles client submission, validation, and error states for wedding invitations.
 */

export async function submitWeddingInquiry(payload) {
  // Client-side quick validation
  const errors = {};
  if (!payload.customer_name?.trim()) {
    errors.customer_name = 'Please provide your full name.';
  }
  const cleanPhone = (payload.phone || '').replace(/[^0-9]/g, '');
  if (!cleanPhone || cleanPhone.length < 10) {
    errors.phone = 'Please provide a valid 10-digit WhatsApp or mobile number.';
  }
  if (!payload.wedding_date?.trim()) {
    errors.wedding_date = 'Please select your wedding or event date.';
  }
  if (!payload.invitation_type) {
    errors.invitation_type = 'Please select an invitation type.';
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      validationErrors: errors,
      error: 'Please complete all required fields correctly.'
    };
  }

  try {
    const response = await fetch('/api/wedding-inquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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
