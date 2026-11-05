import React from 'react';
import type { Address } from '../../types/application';
import type { StudentPersonalInfo } from '../../types/studentAccount';
import { PROVINCES } from '../../data/provinces';

interface StudentPersonalInfoFormProps {
  value: StudentPersonalInfo;
  onChange: (next: StudentPersonalInfo) => void;
}

const SPONSOR_OPTIONS = [
  { value: 'father', label: 'บิดา' },
  { value: 'mother', label: 'มารดา' },
  { value: 'guardian', label: 'ญาติ/ผู้ปกครอง' },
  { value: 'other', label: 'อื่น ๆ' }
];

const labelStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  fontWeight: 600,
  color: 'var(--navy-800)',
  display: 'block',
  marginBottom: 4
};

/**
 * ฟอร์มข้อมูลส่วนตัวเชิงลึกของนักศึกษา (ย้ายมาจากแบบฟอร์มสมัครทุน)
 * ใช้ทั้งในเมนูโปรไฟล์ของนักศึกษา
 */
export const StudentPersonalInfoForm: React.FC<StudentPersonalInfoFormProps> = ({ value, onChange }) => {
  const update = <K extends keyof StudentPersonalInfo>(key: K, next: StudentPersonalInfo[K]) => {
    onChange({ ...value, [key]: next });
  };

  const updateAddress = (which: 'address' | 'idCardAddress', field: keyof Address, next: string) => {
    onChange({
      ...value,
      [which]: { ...value[which], [field]: next },
      // ที่อยู่ปัจจุบันเหมือนทะเบียนบ้าน → เก็บให้ตรงกันอัตโนมัติ
      ...(which === 'idCardAddress' && value.isIdCardAddress
        ? { address: { ...value.address, [field]: next } }
        : {})
    });
  };

  const toggleSponsor = (sponsorValue: string) => {
    const exists = value.sponsor.includes(sponsorValue);
    update('sponsor', exists ? value.sponsor.filter(item => item !== sponsorValue) : [...value.sponsor, sponsorValue]);
  };

  const renderAddressFields = (which: 'address' | 'idCardAddress') => {
    const address = value[which];
    return (
      <>
        <div className="student-info-grid">
          <div>
            <label style={labelStyle}>บ้านเลขที่</label>
            <input
              className="form-input-light"
              value={address.houseNo}
              onChange={e => updateAddress(which, 'houseNo', e.target.value)}
              placeholder="เช่น 1518/23"
            />
          </div>
          <div>
            <label style={labelStyle}>หมู่ที่</label>
            <input
              className="form-input-light"
              value={address.moo}
              onChange={e => updateAddress(which, 'moo', e.target.value)}
              placeholder="เช่น 4"
            />
          </div>
          <div>
            <label style={labelStyle}>ซอย</label>
            <input
              className="form-input-light"
              value={address.soi}
              onChange={e => updateAddress(which, 'soi', e.target.value)}
              placeholder="เช่น ซอยประชาราษฎร์ 1"
            />
          </div>
          <div>
            <label style={labelStyle}>ถนน</label>
            <input
              className="form-input-light"
              value={address.road}
              onChange={e => updateAddress(which, 'road', e.target.value)}
              placeholder="เช่น ถนนประชาราษฎร์"
            />
          </div>
          <div>
            <label style={labelStyle}>ตำบล / แขวง</label>
            <input
              className="form-input-light"
              value={address.subDistrict}
              onChange={e => updateAddress(which, 'subDistrict', e.target.value)}
              placeholder="เช่น วงศ์สว่าง"
            />
          </div>
          <div>
            <label style={labelStyle}>อำเภอ / เขต</label>
            <input
              className="form-input-light"
              value={address.district}
              onChange={e => updateAddress(which, 'district', e.target.value)}
              placeholder="เช่น บางซื่อ"
            />
          </div>
          <div>
            <label style={labelStyle}>จังหวัด</label>
            <select
              className="form-input-light"
              value={address.province}
              onChange={e => updateAddress(which, 'province', e.target.value)}
            >
              <option value="">-- เลือกจังหวัด --</option>
              {PROVINCES.map(province => (
                <option key={province} value={province}>{province}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>รหัสไปรษณีย์</label>
            <input
              className="form-input-light"
              inputMode="numeric"
              maxLength={5}
              value={address.zipCode}
              onChange={e => updateAddress(which, 'zipCode', e.target.value.replace(/\D/g, ''))}
              placeholder="เช่น 10800"
            />
          </div>
        </div>
      </>
    );
  };

  return (
    <div>
      {/* 1. ข้อมูลทั่วไป */}
      <div className="student-info-section">
        <div className="student-info-section-title">ข้อมูลทั่วไปเพิ่มเติม</div>
        <div>
          <label style={labelStyle}>ชื่อเล่น</label>
          <input
            className="form-input-light"
            value={value.nickname}
            onChange={e => update('nickname', e.target.value)}
            placeholder="เช่น มายด์"
          />
        </div>
      </div>

      {/* 2. ที่อยู่ */}
      <div className="student-info-section">
        <div className="student-info-section-title">ที่อยู่ตามทะเบียนบ้าน</div>
        {renderAddressFields('idCardAddress')}

        <label className="student-info-check">
          <input
            type="checkbox"
            checked={value.isIdCardAddress}
            onChange={e => {
              const checked = e.target.checked;
              onChange({
                ...value,
                isIdCardAddress: checked,
                ...(checked ? { address: { ...value.idCardAddress } } : {})
              });
            }}
          />
          <span>ที่อยู่ปัจจุบันเหมือนที่อยู่ในทะเบียนบ้าน</span>
        </label>

        {!value.isIdCardAddress && (
          <>
            <div className="student-info-section-title" style={{ marginTop: 12 }}>ที่อยู่ปัจจุบัน</div>
            {renderAddressFields('address')}
          </>
        )}
      </div>

      {/* 3. ครอบครัว */}
      <div className="student-info-section">
        <div className="student-info-section-title">ข้อมูลครอบครัว</div>
        <div className="student-info-grid">
          <div>
            <label style={labelStyle}>ชื่อ-นามสกุลบิดา</label>
            <input
              className="form-input-light"
              value={value.fatherName}
              onChange={e => update('fatherName', e.target.value)}
              placeholder="ชื่อ-นามสกุลบิดา"
            />
          </div>
          <div>
            <label style={labelStyle}>เบอร์โทรบิดา</label>
            <input
              className="form-input-light"
              value={value.fatherPhone}
              onChange={e => update('fatherPhone', e.target.value)}
              placeholder="เช่น 089-123-4567"
            />
          </div>
          <div>
            <label style={labelStyle}>อาชีพบิดา</label>
            <input
              className="form-input-light"
              value={value.fatherJob}
              onChange={e => update('fatherJob', e.target.value)}
              placeholder="เช่น เกษตรกร / พนักงานบริษัท"
            />
          </div>
          <div>
            <label style={labelStyle}>รายได้บิดา (บาท/เดือน)</label>
            <input
              type="number"
              min="0"
              className="form-input-light"
              value={value.fatherIncome}
              onChange={e => update('fatherIncome', e.target.value)}
              placeholder="เช่น 15000"
            />
          </div>
        </div>

        <div className="student-info-grid" style={{ marginTop: 8 }}>
          <div>
            <label style={labelStyle}>ชื่อ-นามสกุลมารดา</label>
            <input
              className="form-input-light"
              value={value.motherName}
              onChange={e => update('motherName', e.target.value)}
              placeholder="ชื่อ-นามสกุลมารดา"
            />
          </div>
          <div>
            <label style={labelStyle}>เบอร์โทรมารดา</label>
            <input
              className="form-input-light"
              value={value.motherPhone}
              onChange={e => update('motherPhone', e.target.value)}
              placeholder="เช่น 089-123-4567"
            />
          </div>
          <div>
            <label style={labelStyle}>อาชีพมารดา</label>
            <input
              className="form-input-light"
              value={value.motherJob}
              onChange={e => update('motherJob', e.target.value)}
              placeholder="เช่น ค้าขาย / รับจ้าง"
            />
          </div>
          <div>
            <label style={labelStyle}>รายได้มารดา (บาท/เดือน)</label>
            <input
              type="number"
              min="0"
              className="form-input-light"
              value={value.motherIncome}
              onChange={e => update('motherIncome', e.target.value)}
              placeholder="เช่น 15000"
            />
          </div>
        </div>

        <div className="student-info-grid" style={{ marginTop: 8 }}>
          <div>
            <label style={labelStyle}>สถานภาพบิดา-มารดา</label>
            <select
              className="form-input-light"
              value={value.parentsRelation}
              onChange={e => update('parentsRelation', e.target.value as StudentPersonalInfo['parentsRelation'])}
            >
              <option value="together">อยู่ด้วยกัน</option>
              <option value="divorced">แยกกันอยู่ / หย่าร้าง</option>
              <option value="other">อื่น ๆ</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>รายได้รวมครอบครัว (บาท/เดือน)</label>
            <input
              type="number"
              min="0"
              className="form-input-light"
              value={value.familyIncome}
              onChange={e => update('familyIncome', e.target.value)}
              placeholder="เช่น 25000"
            />
          </div>
          <div>
            <label style={labelStyle}>จำนวนพี่น้อง (รวมตัวท่านเอง)</label>
            <input
              type="number"
              min="0"
              className="form-input-light"
              value={value.siblings}
              onChange={e => update('siblings', e.target.value)}
              placeholder="เช่น 3"
            />
          </div>
          <div>
            <label style={labelStyle}>สถานะบิดา</label>
            <select
              className="form-input-light"
              value={value.fatherAlive}
              onChange={e => update('fatherAlive', e.target.value as StudentPersonalInfo['fatherAlive'])}
            >
              <option value="alive">มีชีวิต</option>
              <option value="deceased">เสียชีวิต</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>สถานะมารดา</label>
            <select
              className="form-input-light"
              value={value.motherAlive}
              onChange={e => update('motherAlive', e.target.value as StudentPersonalInfo['motherAlive'])}
            >
              <option value="alive">มีชีวิต</option>
              <option value="deceased">เสียชีวิต</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. แหล่งเงินทุน */}
      <div className="student-info-section">
        <div className="student-info-section-title">แหล่งเงินทุนที่ได้รับ</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {SPONSOR_OPTIONS.map(option => (
            <label key={option.value} className="student-info-check" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={value.sponsor.includes(option.value)}
                onChange={() => toggleSponsor(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>

        {value.sponsor.includes('other') && (
          <div style={{ marginTop: 10 }}>
            <label style={labelStyle}>ระบุแหล่งเงินทุนอื่น ๆ</label>
            <input
              className="form-input-light"
              value={value.sponsorOther}
              onChange={e => update('sponsorOther', e.target.value)}
              placeholder="เช่น ทุนจากวัด / มูลนิธิ"
            />
          </div>
        )}

        <div className="student-info-grid" style={{ marginTop: 10 }}>
          <div>
            <label style={labelStyle}>การกู้ยืมเพื่อการศึกษา</label>
            <select
              className="form-input-light"
              value={value.loanStatus}
              onChange={e => update('loanStatus', e.target.value as StudentPersonalInfo['loanStatus'])}
            >
              <option value="none">ไม่ได้กู้ยืม</option>
              <option value="กยศ">กองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.)</option>
              <option value="กรอ">กองทุนเงินกู้ยืมที่ผูกกับรายได้ในอนาคต (กรอ.)</option>
            </select>
          </div>
          {value.loanStatus !== 'none' && (
            <div>
              <label style={labelStyle}>ยอดกู้ยืมต่อปี (บาท)</label>
              <input
                type="number"
                min="0"
                className="form-input-light"
                value={value.loanAmount}
                onChange={e => update('loanAmount', e.target.value)}
                placeholder="เช่น 60000"
              />
            </div>
          )}
        </div>
      </div>

      {/* 5. งานพิเศษ */}
      <div className="student-info-section">
        <div className="student-info-section-title">งานพิเศษระหว่างเรียน</div>
        <label className="student-info-check" style={{ marginTop: 0 }}>
          <input
            type="checkbox"
            checked={value.hasPartTimeJob}
            onChange={e => update('hasPartTimeJob', e.target.checked)}
          />
          <span>ทำงานพิเศษระหว่างเรียน</span>
        </label>

        {value.hasPartTimeJob && (
          <div className="student-info-grid" style={{ marginTop: 10 }}>
            <div>
              <label style={labelStyle}>สถานที่ทำงาน / ประเภทงาน</label>
              <input
                className="form-input-light"
                value={value.partTimeJobLocation}
                onChange={e => update('partTimeJobLocation', e.target.value)}
                placeholder="เช่น ร้านกาแฟ / สอนพิเศษ"
              />
            </div>
            <div>
              <label style={labelStyle}>รายได้ต่อเดือน (บาท)</label>
              <input
                type="number"
                min="0"
                className="form-input-light"
                value={value.partTimeJobIncome}
                onChange={e => update('partTimeJobIncome', e.target.value)}
                placeholder="เช่น 5000"
              />
            </div>
          </div>
        )}
      </div>

      {/* 6. กิจกรรม */}
      <div className="student-info-section">
        <div className="student-info-section-title">กิจกรรมและจิตอาสา</div>
        <label className="student-info-check" style={{ marginTop: 0 }}>
          <input
            type="checkbox"
            checked={value.hasActivities}
            onChange={e => update('hasActivities', e.target.checked)}
          />
          <span>เข้าร่วมกิจกรรมของมหาวิทยาลัย / จิตอาสา</span>
        </label>

        {value.hasActivities && (
          <div style={{ marginTop: 10 }}>
            <label style={labelStyle}>รายละเอียดกิจกรรม</label>
            <textarea
              className="form-input-light"
              rows={3}
              value={value.activities}
              onChange={e => update('activities', e.target.value)}
              placeholder="เช่น ประธานชมรมคณิตศาสตร์, อาสาสมัครสอนน้อง ๆ"
            />
            <label style={{ ...labelStyle, marginTop: 8 }}>บทบาท / หน้าที่ในกิจกรรม</label>
            <input
              className="form-input-light"
              value={value.activityRole}
              onChange={e => update('activityRole', e.target.value)}
              placeholder="เช่น หัวหน้าโครงการ / สมาชิก"
            />
          </div>
        )}
      </div>
    </div>
  );
};
