'use client';

import { useState } from 'react';

interface SpecItem {
    key: string;
    value: string;
}

interface SpecGroup {
    group: string;
    items: SpecItem[];
}

interface SpecificationsEditorProps {
    value: SpecGroup[];
    onChange: (specs: SpecGroup[]) => void;
    specTemplate?: any[] | null;
}

export default function SpecificationsEditor({ value, onChange, specTemplate }: SpecificationsEditorProps) {
    // If we have a template, merge template fields with existing values
    const getInitialGroups = (): SpecGroup[] => {
        if (!specTemplate || !Array.isArray(specTemplate) || specTemplate.length === 0) {
            // No template: just show existing values or a blank custom group
            return value.length > 0 ? value : [{ group: '產品規格', items: [{ key: '', value: '' }] }];
        }

        // Merge template with existing values
        const existingMap = new Map<string, string>();
        value.forEach(g => g.items.forEach(item => existingMap.set(item.key, item.value)));

        const groups: SpecGroup[] = specTemplate.map((tg: any) => ({
            group: tg.group,
            items: (tg.fields || []).map((f: any) => ({
                key: f.key,
                value: existingMap.get(f.key) || '',
            })),
        }));

        // Find custom items not in template
        const templateKeys = new Set(specTemplate.flatMap((tg: any) => (tg.fields || []).map((f: any) => f.key)));
        const customItems: SpecItem[] = [];
        value.forEach(g => g.items.forEach(item => {
            if (!templateKeys.has(item.key) && item.key) {
                customItems.push(item);
            }
        }));

        if (customItems.length > 0) {
            groups.push({ group: '自訂規格', items: customItems });
        }

        return groups;
    };

    const [groups, setGroups] = useState<SpecGroup[]>(getInitialGroups);

    const updateAndNotify = (newGroups: SpecGroup[]) => {
        setGroups(newGroups);
        // Filter out empty items before sending to parent
        const cleaned = newGroups
            .map(g => ({
                group: g.group,
                items: g.items.filter(item => item.key.trim() && item.value.trim()),
            }))
            .filter(g => g.items.length > 0);
        onChange(cleaned);
    };

    const updateItem = (groupIdx: number, itemIdx: number, field: 'key' | 'value', val: string) => {
        const newGroups = [...groups];
        newGroups[groupIdx] = {
            ...newGroups[groupIdx],
            items: newGroups[groupIdx].items.map((item, i) =>
                i === itemIdx ? { ...item, [field]: val } : item
            ),
        };
        updateAndNotify(newGroups);
    };

    const addCustomItem = () => {
        const newGroups = [...groups];
        const customIdx = newGroups.findIndex(g => g.group === '自訂規格');
        if (customIdx >= 0) {
            newGroups[customIdx] = {
                ...newGroups[customIdx],
                items: [...newGroups[customIdx].items, { key: '', value: '' }],
            };
        } else {
            newGroups.push({ group: '自訂規格', items: [{ key: '', value: '' }] });
        }
        updateAndNotify(newGroups);
    };

    const removeItem = (groupIdx: number, itemIdx: number) => {
        const newGroups = [...groups];
        newGroups[groupIdx] = {
            ...newGroups[groupIdx],
            items: newGroups[groupIdx].items.filter((_, i) => i !== itemIdx),
        };
        if (newGroups[groupIdx].items.length === 0 && newGroups[groupIdx].group === '自訂規格') {
            newGroups.splice(groupIdx, 1);
        }
        updateAndNotify(newGroups);
    };

    const isTemplateField = (groupName: string) => {
        return specTemplate && Array.isArray(specTemplate) && specTemplate.some((tg: any) => tg.group === groupName);
    };

    const getFieldType = (key: string): { type: string; options?: string[] } => {
        if (!specTemplate) return { type: 'text' };
        for (const tg of specTemplate) {
            for (const f of (tg.fields || [])) {
                if (f.key === key) return { type: f.type || 'text', options: f.options };
            }
        }
        return { type: 'text' };
    };

    return (
        <div className="space-y-6">
            {specTemplate && Array.isArray(specTemplate) && specTemplate.length > 0 && (
                <div className="text-xs text-gray-400 font-bold px-2">
                    模板來源：{specTemplate.map((g: any) => g.group).join('、')}
                </div>
            )}

            {groups.map((group, gIdx) => (
                <div key={gIdx} className="space-y-3">
                    <div className="text-sm font-black text-gray-600 px-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-efan-primary rounded-full" />
                        {group.group}
                    </div>
                    <div className="space-y-2">
                        {group.items.map((item, iIdx) => {
                            const fieldInfo = getFieldType(item.key);
                            const isTemplate = isTemplateField(group.group);

                            return (
                                <div key={iIdx} className="flex gap-3 items-center">
                                    <input
                                        type="text"
                                        placeholder="項目名稱"
                                        className={`w-1/3 px-4 py-3 rounded-xl border-none text-sm font-bold ${
                                            isTemplate && item.key
                                                ? 'bg-gray-100 text-gray-500'
                                                : 'bg-gray-50 text-gray-800 focus:ring-2 focus:ring-efan-primary'
                                        }`}
                                        value={item.key}
                                        onChange={(e) => updateItem(gIdx, iIdx, 'key', e.target.value)}
                                        readOnly={!!isTemplate && !!item.key}
                                    />
                                    {fieldInfo.type === 'select' && fieldInfo.options ? (
                                        <select
                                            className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border-none text-sm font-bold text-gray-800 focus:ring-2 focus:ring-efan-primary"
                                            value={item.value}
                                            onChange={(e) => updateItem(gIdx, iIdx, 'value', e.target.value)}
                                        >
                                            <option value="">請選擇...</option>
                                            {fieldInfo.options.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            placeholder="內容"
                                            className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border-none text-sm font-bold text-gray-800 focus:ring-2 focus:ring-efan-primary"
                                            value={item.value}
                                            onChange={(e) => updateItem(gIdx, iIdx, 'value', e.target.value)}
                                        />
                                    )}
                                    {(!isTemplate || group.group === '自訂規格') && (
                                        <button
                                            type="button"
                                            onClick={() => removeItem(gIdx, iIdx)}
                                            className="w-10 h-10 rounded-xl bg-white border border-gray-100 text-gray-300 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all text-sm flex items-center justify-center"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            <button
                type="button"
                onClick={addCustomItem}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 font-bold hover:border-efan-primary hover:text-efan-primary hover:bg-efan-primary/5 transition-all text-sm flex items-center justify-center gap-2"
            >
                ➕ 新增自訂規格
            </button>
        </div>
    );
}
