import { useState } from 'react';

export const useEnterpriseTabs = (defaultTabKey = '1') => {
  const [activeTabKey, setActiveTabKey] = useState(defaultTabKey);
  const [tabErrors, setTabErrors] = useState<string[]>([]);

  const resetTabs = () => {
    setActiveTabKey(defaultTabKey);
    setTabErrors([]);
  };

  const validateAndHandleErrors = async (form: any, fieldToTabMap: Record<string, string>, defaultFallbackTab = '1') => {
    try {
      const values = await form.validateFields();
      setTabErrors([]);
      return { values, isValid: true };
    } catch (errorInfo: any) {
      const { errorFields } = errorInfo;
      if (errorFields && errorFields.length > 0) {
        const newTabErrors: string[] = [];
        let firstErrorTab: string | null = null;

        errorFields.forEach((field: any) => {
          const fieldName = Array.isArray(field.name) ? field.name[0] : field.name;
          const tabKey = fieldToTabMap[fieldName as string] || defaultFallbackTab;

          if (!newTabErrors.includes(tabKey)) {
            newTabErrors.push(tabKey);
          }
          if (!firstErrorTab) {
            firstErrorTab = tabKey;
          }
        });

        setTabErrors(newTabErrors);
        if (firstErrorTab) {
          setActiveTabKey(firstErrorTab);
        }
      }
      return { values: null, isValid: false };
    }
  };

  const renderTabLabel = (label: string, tabKey: string) => {
    const hasError = tabErrors.includes(tabKey);
    return (
      <span style={{ color: hasError ? '#ff4d4f' : undefined }}>
        {label} {hasError && '*'}
      </span>
    );
  };

  return {
    activeTabKey,
    setActiveTabKey,
    tabErrors,
    resetTabs,
    validateAndHandleErrors,
    renderTabLabel
  };
};
