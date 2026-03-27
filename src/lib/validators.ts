// Indian business field validators

export function validateGSTIN(gstin: string): string | null {
  if (!gstin) return null; // Optional field
  const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!pattern.test(gstin.toUpperCase())) {
    return 'Invalid GSTIN format. Expected: 22AAAAA0000A1Z5';
  }
  return null;
}

export function validateIFSC(ifsc: string): string | null {
  if (!ifsc) return null; // Optional field
  const pattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!pattern.test(ifsc.toUpperCase())) {
    return 'Invalid IFSC format. Expected: SBIN0001234';
  }
  return null;
}

export function validatePincode(pincode: string): string | null {
  if (!pincode) return null; // Optional field
  const pattern = /^[1-9][0-9]{5}$/;
  if (!pattern.test(pincode)) {
    return 'Invalid pincode. Must be 6 digits starting with 1-9';
  }
  return null;
}

export function validatePhone(phone: string): string | null {
  if (!phone) return null; // Optional field
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length !== 10) {
    return 'Phone must be 10 digits';
  }
  if (!/^[6-9]/.test(cleaned)) {
    return 'Indian mobile numbers start with 6-9';
  }
  return null;
}

export function validateEmail(email: string): string | null {
  if (!email) return null; // Optional field
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!pattern.test(email)) {
    return 'Invalid email format';
  }
  return null;
}

export function validateUPI(upi: string): string | null {
  if (!upi) return null; // Optional field
  const pattern = /^[\w.\-]+@[\w]+$/;
  if (!pattern.test(upi)) {
    return 'Invalid UPI ID. Expected: name@bank';
  }
  return null;
}