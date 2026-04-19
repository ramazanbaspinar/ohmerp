export const turkishToLower = (text: string | null | undefined): string => {
    if (!text) return '';
    return String(text)
        .replace(/İ/g, 'i')
        .replace(/I/g, 'ı')
        .replace(/Ş/g, 'ş')
        .replace(/Ğ/g, 'ğ')
        .replace(/Ü/g, 'ü')
        .replace(/Ö/g, 'ö')
        .replace(/Ç/g, 'ç')
        .toLowerCase();
};

export const filterOptionTurkish = (input: string, option: any) => {
    const label = option?.children || option?.label || '';
    return turkishToLower(String(label)).includes(turkishToLower(input));
};

export const getErrorMessage = (error: any, fallback = 'İşlem sırasında bir hata oluştu.'): string => {
    const data = error?.response?.data;
    return data?.message || data?.detail || data?.title || fallback;
};
