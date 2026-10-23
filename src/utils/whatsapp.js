/**
 * Generates a pre-filled WhatsApp link for a product inquiry.
 * 
 * @param {string} phone - Vendor's WhatsApp number
 * @param {object} product - The product object
 * @param {object} selectedAttributes - Key-value pair of selected variations (e.g., { "Size": "XL", "Color": "Blue" })
 * @returns {string} The fully formatted wa.me URL
 */
export const generateWhatsAppLink = (phone, product, selectedAttributes = {}) => {
  // 1. Clean the phone number (remove spaces, plus signs, dashes)
  let cleanPhone = phone.replace(/\D/g, '');
  
  // Convert standard Nigerian 080... to 23480... (Target audience normalization)
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '234' + cleanPhone.substring(1);
  }

  // 2. Construct the message
  let message = `Hello 👋\n\nI'm interested in:\n\n`;
  message += `*Product:* ${product.name}\n`;
  message += `*Price:* ₦${product.price.toLocaleString()}\n`;
  
  // 3. Append dynamic attributes if the user selected any
  const attributeKeys = Object.keys(selectedAttributes);
  if (attributeKeys.length > 0) {
    message += `\n*Selected Options:*\n`;
    attributeKeys.forEach(key => {
      message += `- ${key}: ${selectedAttributes[key]}\n`;
    });
  }
  
  message += `\nIs this available?`;
  
  // Append the URL so the vendor knows exactly which item it is
  message += `\n\nLink: ${window.location.origin}/store/${product.store.slug}/product/${product.slug}`;

  // 4. Encode for URL format
  const encodedMessage = encodeURIComponent(message);
  
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};