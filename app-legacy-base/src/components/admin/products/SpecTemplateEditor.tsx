'use client';

import { useState } from 'react';

interface TemplateField {
    key: string;
    type: 'text' | 'select';
    options?: string[];
    filterable: boolean;
}

interface TemplateGroup {
    group: string;
    fields: TemplateField[];
}

interface SpecTemplateEditorProps {
    value: TemplateGroup[] | null;
    onChange: (template: TemplateGroup[] | null) => void;
}

export default function SpecTemplateEditor({ value, onChange }: SpecTemplateEditorProps) {
    const [groups, setGroups] = useState<TemplateGroup[]>(value || []);
    const [newOptionInputs, setNewOptionInputs] = useState<Record<string, string>>({});

    const notify = (newGroups: TemplateGroup[]) => {
        setGroups(newGroups);
        // Store null if empty (not [])
        onChange(newGroups.length === 0 ? null : newGroups);
    };

    // === Group operations ===
    const addGroup = () => {
        notify([...groups, { group: '', fields: [{ key: '', type: 'text', filterable: false }] }]);
    };

    const removeGroup = (gIdx: number) => {
        notify(groups.filter((_, i) => i !== gIdx));
    };

    const updateGroupName = (gIdx: number, name: string) => {
        const g = [...groups];
        g[gIdx] = { ...g[gIdx], group: name };
        notify(g);
    };

    // === Field operations ===
    const addField = (gIdx: number) => {
        const g = [...groups];
        g[gIdx] = { ...g[gIdx], fields: [...g[gIdx].fields, { key: '', type: 'text', filterable: false }] };
        notify(g);
    };

    const removeField = (gIdx: number, fIdx: number) => {
        const g = [...groups];
        g[gIdx] = { ...g[gIdx], fields: g[gIdx].fields.filter((_, i) => i !== fIdx) };
        notify(g);
    };

    const updateField = (gIdx: number, fIdx: number, patch: Partial<TemplateField>) => {
        const g = [...groups];
        const field = { ...g[gIdx].fields[fIdx], ...patch };
        // If switching from select to text, remove options
        if (patch.type === 'text') {
            delete field.options;
        }
        // If switching to select and no options yet, initialize
        if (patch.type === 'select' && !field.options) {
            field.options = [];
        }
        g[gIdx] = { ...g[gIdx], fields: g[gIdx].fields.map((f, i) => i === fIdx ? field : f) };
        notify(g);
    };

    // === Option operations ===
    const addOption = (gIdx: number, fIdx: number) => {
        const inputKey = `${gIdx}-${fIdx}`;
        const val = (newOptionInputs[inputKey] || '').trim();
        if (!val) return;

        const g = [...groups];
        const field = { ...g[gIdx].fields[fIdx] };
        field.options = [...(field.options || []), val];
        g[gIdx] = { ...g[gIdx], fields: g[gIdx].fields.map((f, i) => i === fIdx ? field : f) };
        notify(g);
        setNewOptionInputs(prev => ({ ...prev, [inputKey]: '' }));
    };

    const removeOption = (gIdx: number, fIdx: number, oIdx: number) => {
        const g = [...groups];
        const field = { ...g[gIdx].fields[fIdx] };
        field.options = (field.options || []).filter((_, i) => i !== oIdx);
        g[gIdx] = { ...g[gIdx], fields: g[gIdx].fields.map((f, i) => i === fIdx ? field : f) };
        notify(g);
    };

    return (
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {groups.length === 0 && (
                <div className="text-center text-gray-400 text-sm py-4 italic">
                    尚未設定規格模板。新增分組即可開始定義此分類的規格欄位。
                </div>
            )}

            {groups.map((group, gIdx) => (
                <div key={gIdx} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
                    {/* Group header */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-black">分組</span>
                        <input
                            type="text"
                            placeholder="分組名稱（如：基本規格）"
                            className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm font-bold border-none focus:ring-2 focus:ring-blue-500"
                            value={group.group}
                            onChange={(e) => updateGroupName(gIdx, e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => removeGroup(gIdx)}
                            className="w-8 h-8 rounded-lg bg-gray-50 text-gray-300 hover:bg-red-500 hover:text-white transition-all text-xs flex items-center justify-center"
                            title="刪除分組"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Fields */}
                    <div className="space-y-2 pl-2 border-l-2 border-gray-100 ml-1">
                        {group.fields.map((field, fIdx) => (
                            <div key={fIdx} className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    {/* Key */}
                                    <input
                                        type="text"
                                        placeholder="欄位名稱"
                                        className="w-1/3 px-3 py-2 bg-gray-50 rounded-lg text-sm font-bold border-none focus:ring-2 focus:ring-blue-500"
                                        value={field.key}
                                        onChange={(e) => updateField(gIdx, fIdx, { key: e.target.value })}
                                    />
                                    {/* Type */}
                                    <select
                                        className="px-3 py-2 bg-gray-50 rounded-lg text-xs font-bold border-none focus:ring-2 focus:ring-blue-500"
                                        value={field.type}
                                        onChange={(e) => updateField(gIdx, fIdx, { type: e.target.value as 'text' | 'select' })}
                                    >
                                        <option value="text">自由填寫</option>
                                        <option value="select">下拉選擇</option>
                                    </select>
                                    {/* Filterable */}
                                    <label className="flex items-center gap-1.5 text-xs font-bold text-gray-400 whitespace-nowrap cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                                            checked={field.filterable}
                                            onChange={(e) => updateField(gIdx, fIdx, { filterable: e.target.checked })}
                                        />
                                        可篩選
                                    </label>
                                    {/* Delete field */}
                                    <button
                                        type="button"
                                        onClick={() => removeField(gIdx, fIdx)}
                                        className="w-7 h-7 rounded-lg bg-gray-50 text-gray-300 hover:bg-red-500 hover:text-white transition-all text-[10px] flex items-center justify-center"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Options for select type */}
                                {field.type === 'select' && (
                                    <div className="flex flex-wrap items-center gap-1.5 pl-2 ml-1">
                                        <span className="text-[10px] font-bold text-gray-400">選項:</span>
                                        {(field.options || []).map((opt, oIdx) => (
                                            <span key={oIdx} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">
                                                {opt}
                                                <button
                                                    type="button"
                                                    onClick={() => removeOption(gIdx, fIdx, oIdx)}
                                                    className="text-blue-400 hover:text-red-500 transition-colors text-[10px]"
                                                >
                                                    ✕
                                                </button>
                                            </span>
                                        ))}
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="text"
                                                placeholder="新選項"
                                                className="w-20 px-2 py-1 bg-white rounded-lg text-xs font-bold border border-gray-100 focus:ring-1 focus:ring-blue-500"
                                                value={newOptionInputs[`${gIdx}-${fIdx}`] || ''}
                                                onChange={(e) => setNewOptionInputs(prev => ({ ...prev, [`${gIdx}-${fIdx}`]: e.target.value }))}
                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(gIdx, fIdx); } }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => addOption(gIdx, fIdx)}
                                                className="px-2 py-1 bg-blue-500 text-white rounded-lg text-[10px] font-bold hover:bg-blue-600 transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Add field button */}
                        <button
                            type="button"
                            onClick={() => addField(gIdx)}
                            className="w-full py-2 text-xs font-bold text-gray-400 hover:text-blue-500 transition-colors"
                        >
                            ➕ 新增欄位
                        </button>
                    </div>
                </div>
            ))}

            {/* Add group button */}
            <button
                type="button"
                onClick={addGroup}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 font-bold hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all text-sm flex items-center justify-center gap-2"
            >
                ➕ 新增分組
            </button>
        </div>
    );
}
