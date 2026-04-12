'use client';

import { ADMIN_PRODUCT_COPY } from '@/lib/admin-product-copy';
import { Card, Label, SectionHeader, inputClass, inputSmClass } from './productFormShared';

interface CategoryOption {
    id: string;
    name: string;
    parentId?: string | null;
}

interface ProductOption {
    id: string;
    brand?: string | null;
    name: string;
    model?: string | null;
    type: string;
}

interface BundleItem {
    productId: string;
    quantity: number;
    sortOrder: number;
}

export interface QuoteTabFormData {
    categoryId: string;
    brand: string;
    model: string;
    name: string;
    description: string;
    quoteName: string;
    quoteDesc: string;
    type: 'single' | 'bundle';
    unit: string;
    costPrice: number;
    marketPrice: number;
    sellingPrice: number;
    repairPrice: number;
    isHiddenItem: boolean;
    isQuickAccess: boolean;
    isAI: boolean;
    isHot: boolean;
    isNew: boolean;
    notes: string;
    currentStock: number;
    lowStockThreshold: number;
    trackInventory: boolean;
    bundleItems: BundleItem[];
}

interface ProductFormQuoteTabProps {
    id?: string;
    formData: QuoteTabFormData;
    categories: CategoryOption[];
    allProducts: ProductOption[];
    loading: boolean;
    updateQuoteFields: (fields: Partial<QuoteTabFormData>) => void;
    addBundleItem: () => void;
    removeBundleItem: (index: number) => void;
    updateBundleItem: (index: number, field: string, value: any) => void;
    handleSaveTab1: () => void;
}

export default function ProductFormQuoteTab({
    id,
    formData,
    categories,
    allProducts,
    loading,
    updateQuoteFields,
    addBundleItem,
    removeBundleItem,
    updateBundleItem,
    handleSaveTab1,
}: ProductFormQuoteTabProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
                <Card>
                    <SectionHeader number="01" title={ADMIN_PRODUCT_COPY.form.quote.basicSectionTitle} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>{ADMIN_PRODUCT_COPY.form.quote.productName}</Label>
                            <input required className={inputClass} value={formData.name} onChange={(e) => updateQuoteFields({ name: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <Label>{ADMIN_PRODUCT_COPY.form.quote.productCategory}</Label>
                            <select required className={inputClass} value={formData.categoryId} onChange={(e) => updateQuoteFields({ categoryId: e.target.value })}>
                                <option value="">{ADMIN_PRODUCT_COPY.form.quote.productCategoryPlaceholder}</option>
                                {categories.map((c) => (<option key={c.id} value={c.id}>{c.parentId ? `└ ${c.name}` : c.name}</option>))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <Label>{ADMIN_PRODUCT_COPY.form.quote.brand}</Label>
                            <input className={inputClass} value={formData.brand} onChange={(e) => updateQuoteFields({ brand: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <Label>{ADMIN_PRODUCT_COPY.form.quote.model}</Label>
                            <input className={inputClass} value={formData.model} onChange={(e) => updateQuoteFields({ model: e.target.value })} />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                            <Label>{ADMIN_PRODUCT_COPY.form.quote.description}</Label>
                            <textarea className={`${inputClass} min-h-[100px]`} value={formData.description} onChange={(e) => updateQuoteFields({ description: e.target.value })} />
                        </div>
                    </div>
                </Card>

                <Card>
                    <SectionHeader number="02" title={ADMIN_PRODUCT_COPY.form.quote.pricingSectionTitle} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <Label>{ADMIN_PRODUCT_COPY.form.quote.costPrice}</Label>
                            <input type="number" required className={`${inputClass} text-efan-primary text-lg`} value={formData.costPrice} onChange={(e) => updateQuoteFields({ costPrice: parseFloat(e.target.value) })} />
                        </div>
                        <div className="space-y-1">
                            <Label>{ADMIN_PRODUCT_COPY.form.quote.sellingPrice}</Label>
                            <input type="number" required className={`${inputClass} text-efan-primary text-lg`} value={formData.sellingPrice} onChange={(e) => updateQuoteFields({ sellingPrice: parseFloat(e.target.value) })} />
                        </div>
                        <div className="space-y-1">
                            <Label>{ADMIN_PRODUCT_COPY.form.quote.marketPrice}</Label>
                            <input type="number" className={`${inputClass} text-gray-400 text-lg`} value={formData.marketPrice} onChange={(e) => updateQuoteFields({ marketPrice: parseFloat(e.target.value) })} />
                        </div>
                        <div className="space-y-1">
                            <Label>{ADMIN_PRODUCT_COPY.form.quote.repairPrice}</Label>
                            <input type="number" className={`${inputClass} text-gray-400 text-lg`} value={formData.repairPrice} onChange={(e) => updateQuoteFields({ repairPrice: parseFloat(e.target.value) })} />
                        </div>
                        <div className="space-y-1">
                            <Label>{ADMIN_PRODUCT_COPY.form.quote.unit}</Label>
                            <input className={inputClass} value={formData.unit} onChange={(e) => updateQuoteFields({ unit: e.target.value })} />
                        </div>
                        <div className="md:col-span-3 pb-3 border-b border-gray-100 mb-2">
                            <div className="flex items-center gap-3 bg-orange-50/50 p-4 rounded-2xl border border-orange-100 transition-all hover:bg-white hover:shadow-lg">
                                <div onClick={() => updateQuoteFields({ trackInventory: !formData.trackInventory })} className={`w-12 h-7 rounded-full transition-all relative cursor-pointer ${formData.trackInventory ? 'bg-efan-primary' : 'bg-gray-300'}`}>
                                    <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all ${formData.trackInventory ? 'left-[22px]' : 'left-0.5'}`} />
                                </div>
                                <div>
                                    <div className="text-sm font-black text-gray-700">{ADMIN_PRODUCT_COPY.form.quote.inventoryTitle}</div>
                                    <div className="text-[10px] font-bold text-gray-400">{ADMIN_PRODUCT_COPY.form.quote.inventoryHint}</div>
                                </div>
                            </div>
                        </div>
                        <div className={`space-y-1 transition-opacity ${!formData.trackInventory ? 'opacity-30 pointer-events-none' : ''}`}>
                            <Label>{ADMIN_PRODUCT_COPY.form.quote.currentStock}</Label>
                            <input type="number" className={`${inputClass} text-lg`} value={formData.currentStock} onChange={(e) => updateQuoteFields({ currentStock: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div className={`space-y-1 transition-opacity ${!formData.trackInventory ? 'opacity-30 pointer-events-none' : ''}`}>
                            <Label>{ADMIN_PRODUCT_COPY.form.quote.lowStockThreshold}</Label>
                            <input type="number" className={`${inputClass} text-red-500 text-lg`} value={formData.lowStockThreshold} onChange={(e) => updateQuoteFields({ lowStockThreshold: parseInt(e.target.value) || 0 })} />
                        </div>
                    </div>
                </Card>

                <Card>
                    <SectionHeader number="03" title={ADMIN_PRODUCT_COPY.form.quote.typeSectionTitle} />
                    <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-inner w-fit mb-3">
                        <button type="button" onClick={() => updateQuoteFields({ type: 'single' })} className={`px-5 py-1.5 rounded-lg text-xs font-black transition-all ${formData.type === 'single' ? 'bg-white text-efan-primary shadow-sm' : 'text-gray-400'}`}>{ADMIN_PRODUCT_COPY.form.quote.single}</button>
                        <button type="button" onClick={() => updateQuoteFields({ type: 'bundle' })} className={`px-5 py-1.5 rounded-lg text-xs font-black transition-all ${formData.type === 'bundle' ? 'bg-white text-efan-primary shadow-sm' : 'text-gray-400'}`}>{ADMIN_PRODUCT_COPY.form.quote.bundle}</button>
                    </div>

                    {formData.type === 'bundle' && (
                        <div className="space-y-3">
                            <div className="space-y-2 max-h-[350px] overflow-y-auto">
                                {formData.bundleItems.map((item, index) => (
                                    <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 items-end">
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 pl-2">{ADMIN_PRODUCT_COPY.form.quote.bundleProduct}</label>
                                            <select className={inputSmClass} value={item.productId} onChange={(e) => updateBundleItem(index, 'productId', e.target.value)}>
                                                <option value="">{ADMIN_PRODUCT_COPY.form.quote.bundleProductPlaceholder}</option>
                                                {allProducts.filter((p) => p.type === 'single' && p.id !== id).map((p) => (<option key={p.id} value={p.id}>{p.brand} {p.name} ({p.model})</option>))}
                                            </select>
                                        </div>
                                        <div className="w-24 space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 pl-2">{ADMIN_PRODUCT_COPY.form.quote.quantity}</label>
                                            <input type="number" className={`${inputSmClass} text-center`} value={item.quantity} onChange={(e) => updateBundleItem(index, 'quantity', parseInt(e.target.value))} />
                                        </div>
                                        <button type="button" onClick={() => removeBundleItem(index)} className="p-3 rounded-xl bg-white border border-gray-100 text-gray-300 hover:bg-red-500 hover:text-white transition-all">{ADMIN_PRODUCT_COPY.form.removeLine}</button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={addBundleItem} className="w-full py-4 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 font-bold hover:border-efan-primary hover:text-efan-primary transition-all text-sm flex items-center justify-center gap-2">
                                {ADMIN_PRODUCT_COPY.form.quote.addBundleItem}
                            </button>
                        </div>
                    )}
                    {formData.type === 'single' && (
                        <div className="py-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 text-center">
                            <div className="text-3xl mb-2">📦</div>
                            <p className="text-gray-400 font-bold text-sm px-8">{ADMIN_PRODUCT_COPY.form.quote.bundleEmptyHint}</p>
                        </div>
                    )}
                </Card>
            </div>

            <div className="space-y-4 lg:sticky lg:top-8 self-start">
                <Card>
                    <h3 className="text-base font-black text-gray-800 mb-3 flex items-center gap-2">{ADMIN_PRODUCT_COPY.form.quote.quoteDisplayTitle}</h3>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label>{ADMIN_PRODUCT_COPY.form.quote.quoteName}</Label>
                            <input placeholder={ADMIN_PRODUCT_COPY.form.quote.quoteNamePlaceholder} className={inputSmClass} value={formData.quoteName} onChange={(e) => updateQuoteFields({ quoteName: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <Label>{ADMIN_PRODUCT_COPY.form.quote.quoteDescription}</Label>
                            <textarea className={`${inputSmClass} min-h-[80px]`} value={formData.quoteDesc} onChange={(e) => updateQuoteFields({ quoteDesc: e.target.value })} />
                        </div>
                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 transition-all hover:bg-white">
                            <div onClick={() => updateQuoteFields({ isHiddenItem: !formData.isHiddenItem })} className={`w-12 h-7 rounded-full transition-all relative cursor-pointer ${formData.isHiddenItem ? 'bg-efan-primary' : 'bg-gray-300'}`}>
                                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all ${formData.isHiddenItem ? 'left-[22px]' : 'left-0.5'}`} />
                            </div>
                            <div>
                                <div className="text-sm font-black text-gray-700">{ADMIN_PRODUCT_COPY.form.quote.hiddenItemTitle}</div>
                                <div className="text-[10px] font-bold text-gray-400">{ADMIN_PRODUCT_COPY.form.quote.hiddenItemHint}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-amber-50/50 p-3 rounded-xl border border-amber-100 transition-all hover:bg-white">
                            <div onClick={() => updateQuoteFields({ isQuickAccess: !formData.isQuickAccess })} className={`w-12 h-7 rounded-full transition-all relative cursor-pointer ${formData.isQuickAccess ? 'bg-amber-500' : 'bg-gray-300'}`}>
                                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all ${formData.isQuickAccess ? 'left-[22px]' : 'left-0.5'}`} />
                            </div>
                            <div>
                                <div className="text-sm font-black text-gray-700">{ADMIN_PRODUCT_COPY.form.quote.quickAccessTitle}</div>
                                <div className="text-[10px] font-bold text-gray-400">{ADMIN_PRODUCT_COPY.form.quote.quickAccessHint}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-purple-50/50 p-3 rounded-xl border border-purple-100 transition-all hover:bg-white">
                            <div onClick={() => updateQuoteFields({ isAI: !formData.isAI })} className={`w-12 h-7 rounded-full transition-all relative cursor-pointer ${formData.isAI ? 'bg-gradient-to-r from-purple-600 to-blue-500' : 'bg-gray-300'}`}>
                                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all ${formData.isAI ? 'left-[22px]' : 'left-0.5'}`} />
                            </div>
                            <div>
                                <div className="text-sm font-black text-gray-700">{ADMIN_PRODUCT_COPY.form.quote.aiTitle}</div>
                                <div className="text-[10px] font-bold text-gray-400">{ADMIN_PRODUCT_COPY.form.quote.aiHint}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-orange-50/50 p-3 rounded-xl border border-orange-100 transition-all hover:bg-white">
                            <div onClick={() => updateQuoteFields({ isHot: !formData.isHot })} className={`w-12 h-7 rounded-full transition-all relative cursor-pointer ${formData.isHot ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gray-300'}`}>
                                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all ${formData.isHot ? 'left-[22px]' : 'left-0.5'}`} />
                            </div>
                            <div>
                                <div className="text-sm font-black text-gray-700">{ADMIN_PRODUCT_COPY.form.quote.hotTitle}</div>
                                <div className="text-[10px] font-bold text-gray-400">{ADMIN_PRODUCT_COPY.form.quote.hotHint}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 transition-all hover:bg-white">
                            <div onClick={() => updateQuoteFields({ isNew: !formData.isNew })} className={`w-12 h-7 rounded-full transition-all relative cursor-pointer ${formData.isNew ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' : 'bg-gray-300'}`}>
                                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all ${formData.isNew ? 'left-[22px]' : 'left-0.5'}`} />
                            </div>
                            <div>
                                <div className="text-sm font-black text-gray-700">{ADMIN_PRODUCT_COPY.form.quote.newTitle}</div>
                                <div className="text-[10px] font-bold text-gray-400">{ADMIN_PRODUCT_COPY.form.quote.newHint}</div>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card>
                    <h3 className="text-base font-black text-gray-800 mb-3 flex items-center gap-2">{ADMIN_PRODUCT_COPY.form.quote.notesTitle}</h3>
                    <textarea placeholder={ADMIN_PRODUCT_COPY.form.quote.notesPlaceholder} className={`${inputSmClass} min-h-[120px]`} value={formData.notes} onChange={(e) => updateQuoteFields({ notes: e.target.value })} />
                </Card>

                <button type="button" onClick={handleSaveTab1} disabled={loading}
                    className="w-full py-4 rounded-2xl bg-efan-primary text-white font-black hover:bg-efan-primary-dark transition-all shadow-xl shadow-efan-primary/30 disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? ADMIN_PRODUCT_COPY.common.saving : ADMIN_PRODUCT_COPY.form.quote.saveButton}
                </button>
            </div>
        </div>
    );
}
