import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRecords } from '../../hooks/useRecords';
import { useTask } from '../../hooks/useTask';
import { LocationPicker, PickedLocation } from './LocationPicker';
import { PhotoUploader } from './PhotoUploader';
import { compressImage } from '../../utils/imageCompress';
import { supabase, STORAGE_BUCKET } from '../../config/supabase';
import {
  STREETS,
  COMMUNITIES,
  WATER_TYPES,
  ADULT_METHODS,
  DISEASE_TYPES,
} from '../../config';
import { RecordType, CreateRecordInput } from '../../types';

interface DynamicFormProps {
  type: RecordType;
  initialData?: any; // 编辑时的初始数据
  onClose: () => void;
  onSuccess: () => void;
}

// 字段通用样式
const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  marginBottom: '12px',
  border: '1px solid #ddd',
  borderRadius: '6px',
  fontSize: '14px',
};

const labelStyle = {
  display: 'block',
  marginBottom: '4px',
  fontWeight: 500,
  fontSize: '14px',
};

export const DynamicForm: React.FC<DynamicFormProps> = ({ type, initialData, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { createRecord, updateRecord } = useRecords();
  const { currentTask } = useTask();
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<PickedLocation | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>(initialData?.photos || []);
  const [formData, setFormData] = useState<any>({});

  // 行政区划
  const [selectedStreet, setSelectedStreet] = useState(initialData?.street || (user?.role === 'user' ? user?.region : ''));
  const [availableCommunities, setAvailableCommunities] = useState<string[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState(initialData?.community || '');

  useEffect(() => {
    if (selectedStreet) {
      setAvailableCommunities(COMMUNITIES[selectedStreet] || []);
    } else {
      setAvailableCommunities([]);
    }
  }, [selectedStreet]);

  // 初始化表单默认值（五类标记）
  useEffect(() => {
    if (initialData) {
      setFormData(initialData.formData || {});
      if (initialData.location) setSelectedLocation(initialData.location);
      if (initialData.street) setSelectedStreet(initialData.street);
      if (initialData.community) setSelectedCommunity(initialData.community);
    } else {
      // 新建时的默认值
      const defaults: any = {};
      if (type === 'case') {
        defaults.diseaseType = DISEASE_TYPES[0];
        defaults.onsetDate = '';
        defaults.isolationStart = '';
        defaults.isolationEnd = '';
        defaults.epidemicEndDate = '';
      } else if (type === 'water') {
        defaults.waterType = WATER_TYPES[0];
        defaults.positiveStatus = 'pending';
        defaults.processedDate = '';
      } else if (type === 'blackspot') {
        defaults.description = '';
        defaults.remark = '';
        defaults.processedDate = '';
      } else if (type === 'adult') {
        defaults.method = ADULT_METHODS[0];
        defaults.density = 0;
        defaults.species = '';
      } else if (type === 'trap') {
        defaults.placementDate = '';
        defaults.isValid = true;
        defaults.invalidReason = '';
        defaults.positiveStatus = 'pending';
        defaults.markedDate = new Date().toISOString().slice(0, 10);
      }
      setFormData(defaults);
    }
  }, [type, initialData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleStreetChange = (street: string) => {
    setSelectedStreet(street);
    setSelectedCommunity('');
  };

  // 上传照片到 Supabase Storage
  const uploadPhotos = async (recordId: string, files: File[]): Promise<string[]> => {
    const paths: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const compressed = await compressImage(file);
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}_${i}.${ext}`;
      const filePath = `${user?.id}/${currentTask?.id || 'no_task'}/${recordId}/${fileName}`;
      const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, compressed);
      if (error) throw error;
      paths.push(filePath);
    }
    return paths;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) {
      alert('请先在地图上选择位置');
      return;
    }
    if (!selectedStreet || !selectedCommunity) {
      alert('请选择街道和居委会');
      return;
    }
    setLoading(true);
    try {
      // 构建记录数据
      const recordData: CreateRecordInput = {
        type,
        location: { lng: selectedLocation.lng, lat: selectedLocation.lat },
        address: selectedLocation.address || '',
        district: '海珠区',
        street: selectedStreet,
        community: selectedCommunity,
        photos: [], // 暂存，后面更新
        formData,
        taskId: currentTask?.id || null,
      };

      let savedRecord;
      if (initialData?.id) {
        // 编辑：先更新记录（不含新照片），再处理新照片
        const updated = await updateRecord(initialData.id, {
          ...recordData,
          photos: existingPhotos,
        });
        savedRecord = updated;
        // 上传新照片
        if (photoFiles.length > 0) {
          const newPhotoPaths = await uploadPhotos(savedRecord.id, photoFiles);
          const allPhotos = [...existingPhotos, ...newPhotoPaths];
          await updateRecord(savedRecord.id, { photos: allPhotos });
        }
      } else {
        // 新建：先创建记录（无照片），再上传照片，最后更新 photos 字段
        const created = await createRecord(recordData);
        savedRecord = created;
        if (photoFiles.length > 0) {
          const photoPaths = await uploadPhotos(savedRecord.id, photoFiles);
          await updateRecord(savedRecord.id, { photos: photoPaths });
        }
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('保存失败', err);
      alert('保存失败，请检查网络后重试');
    } finally {
      setLoading(false);
    }
  };

  // 渲染不同标记类型的特有字段
  const renderSpecificFields = () => {
    switch (type) {
      case 'case':
        return (
          <>
            <label style={labelStyle}>病例编号 *</label>
            <input style={inputStyle} value={formData.caseNumber || ''} onChange={e => handleInputChange('caseNumber', e.target.value)} required />
            <label style={labelStyle}>疾病类型</label>
            <select style={inputStyle} value={formData.diseaseType || ''} onChange={e => handleInputChange('diseaseType', e.target.value)}>
              {DISEASE_TYPES.map(d => <option key={d}>{d}</option>)}
            </select>
            <label style={labelStyle}>患者姓名</label>
            <input style={inputStyle} value={formData.patientName || ''} onChange={e => handleInputChange('patientName', e.target.value)} />
            <label style={labelStyle}>发病日期</label>
            <input type="date" style={inputStyle} value={formData.onsetDate || ''} onChange={e => handleInputChange('onsetDate', e.target.value)} />
            <label style={labelStyle}>隔离起止日期</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="date" style={{ flex: 1, ...inputStyle }} value={formData.isolationStart || ''} onChange={e => handleInputChange('isolationStart', e.target.value)} placeholder="开始" />
              <input type="date" style={{ flex: 1, ...inputStyle }} value={formData.isolationEnd || ''} onChange={e => handleInputChange('isolationEnd', e.target.value)} placeholder="结束" />
            </div>
            <label style={labelStyle}>疫点结束日期</label>
            <input type="date" style={inputStyle} value={formData.epidemicEndDate || ''} onChange={e => handleInputChange('epidemicEndDate', e.target.value)} />
          </>
        );
      case 'water':
        return (
          <>
            <label style={labelStyle}>积水类型</label>
            <select style={inputStyle} value={formData.waterType || ''} onChange={e => handleInputChange('waterType', e.target.value)}>
              {WATER_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <label style={labelStyle}>阳性状态</label>
            <select style={inputStyle} value={formData.positiveStatus || 'pending'} onChange={e => handleInputChange('positiveStatus', e.target.value)}>
              <option value="pending">待检测</option>
              <option value="positive">阳性</option>
            </select>
            <label style={labelStyle}>处理日期</label>
            <input type="date" style={inputStyle} value={formData.processedDate || ''} onChange={e => handleInputChange('processedDate', e.target.value)} />
          </>
        );
      case 'blackspot':
        return (
          <>
            <label style={labelStyle}>位置描述 *</label>
            <textarea style={{ ...inputStyle, minHeight: 60 }} value={formData.description || ''} onChange={e => handleInputChange('description', e.target.value)} required />
            <label style={labelStyle}>备注</label>
            <textarea style={{ ...inputStyle, minHeight: 60 }} value={formData.remark || ''} onChange={e => handleInputChange('remark', e.target.value)} />
            <label style={labelStyle}>处理日期</label>
            <input type="date" style={inputStyle} value={formData.processedDate || ''} onChange={e => handleInputChange('processedDate', e.target.value)} />
          </>
        );
      case 'adult':
        return (
          <>
            <label style={labelStyle}>监测方法</label>
            <select style={inputStyle} value={formData.method || ''} onChange={e => handleInputChange('method', e.target.value)}>
              {ADULT_METHODS.map(m => <option key={m}>{m}</option>)}
            </select>
            <label style={labelStyle}>成蚊密度</label>
            <input type="number" step="0.1" style={inputStyle} value={formData.density || 0} onChange={e => handleInputChange('density', parseFloat(e.target.value))} />
            <label style={labelStyle}>蚊种</label>
            <input style={inputStyle} value={formData.species || ''} onChange={e => handleInputChange('species', e.target.value)} />
          </>
        );
      case 'trap':
        return (
          <>
            <label style={labelStyle}>放置日期</label>
            <input type="date" style={inputStyle} value={formData.placementDate || ''} onChange={e => handleInputChange('placementDate', e.target.value)} />
            <label style={labelStyle}>是否有效</label>
            <select style={inputStyle} value={formData.isValid ? '是' : '否'} onChange={e => handleInputChange('isValid', e.target.value === '是')}>
              <option value="是">是</option>
              <option value="否">否</option>
            </select>
            {formData.isValid === false && (
              <>
                <label style={labelStyle}>无效原因</label>
                <input style={inputStyle} value={formData.invalidReason || ''} onChange={e => handleInputChange('invalidReason', e.target.value)} />
              </>
            )}
            <label style={labelStyle}>阳性状态</label>
            <select style={inputStyle} value={formData.positiveStatus || 'pending'} onChange={e => handleInputChange('positiveStatus', e.target.value)}>
              <option value="pending">待检测</option>
              <option value="positive">阳性</option>
              <option value="negative">阴性</option>
            </select>
            <label style={labelStyle}>标记日期</label>
            <input type="date" style={inputStyle} value={formData.markedDate || ''} onChange={e => handleInputChange('markedDate', e.target.value)} />
            <label style={labelStyle}>回收日期</label>
            <input type="date" style={inputStyle} value={formData.回收日期 || ''} onChange={e => handleInputChange('回收日期', e.target.value)} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="form-modal" style={{ padding: 16, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3>{initialData ? '编辑' : '新增'}{type === 'case' ? '病例' : type === 'water' ? '积水点' : type === 'blackspot' ? '黑点' : type === 'adult' ? '成蚊监测' : '诱蚊诱卵器'}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>✕</button>
      </div>
      <form onSubmit={handleSubmit}>
        {/* 位置选择 */}
        <label style={labelStyle}>位置（点击地图选点）*</label>
        <LocationPicker
          onLocationPicked={(loc) => setSelectedLocation(loc)}
          initialLocation={selectedLocation}
        />
        {selectedLocation && (
          <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
            已选坐标: {selectedLocation.lng.toFixed(6)}, {selectedLocation.lat.toFixed(6)}<br />
            地址: {selectedLocation.address || '—'}
          </div>
        )}

        {/* 行政区划手动选择 */}
        <label style={labelStyle}>街道 *</label>
        <select
          style={inputStyle}
          value={selectedStreet || ''}
          onChange={e => handleStreetChange(e.target.value)}
          disabled={user?.role === 'user'}
          required
        >
          <option value="">请选择街道</option>
          {STREETS.map(s => <option key={s}>{s}</option>)}
        </select>
        <label style={labelStyle}>居委会 *</label>
        <select
          style={inputStyle}
          value={selectedCommunity}
          onChange={e => setSelectedCommunity(e.target.value)}
          required
          disabled={!selectedStreet}
        >
          <option value="">请选择居委会</option>
          {availableCommunities.map(c => <option key={c}>{c}</option>)}
        </select>

        {/* 类型特有字段 */}
        {renderSpecificFields()}

        {/* 照片上传 */}
        <label style={labelStyle}>照片</label>
        <PhotoUploader
          onFilesSelected={setPhotoFiles}
          existingPhotos={existingPhotos}
          onRemoveExisting={(index) => {
            const newList = [...existingPhotos];
            newList.splice(index, 1);
            setExistingPhotos(newList);
          }}
        />

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: 10, background: '#f5f5f5', border: 'none', borderRadius: 6 }}>取消</button>
          <button type="submit" disabled={loading} style={{ flex: 1, padding: 10, background: '#1890ff', color: 'white', border: 'none', borderRadius: 6 }}>
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
};