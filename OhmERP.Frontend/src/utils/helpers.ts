export const formatSystemCode = (value: string): string => {
  if (!value) return '';

  let formatted = value;

  formatted = formatted.replace(/\s+/g, '_');

  const turkishChars: { [key: string]: string } = {
    'ş': 'S', 'Ş': 'S',
    'ı': 'I', 'I': 'I', 'İ': 'I', 'i': 'I',
    'ğ': 'G', 'Ğ': 'G',
    'ö': 'O', 'Ö': 'O',
    'ü': 'U', 'Ü': 'U',
    'ç': 'C', 'Ç': 'C'
  };

  formatted = formatted.replace(/[şŞıIİiğĞöÖüÜçÇ]/g, char => turkishChars[char] || char);

  formatted = formatted.toUpperCase();

  formatted = formatted.replace(/[^A-Z0-9_-]/g, '');

  return formatted;
};
