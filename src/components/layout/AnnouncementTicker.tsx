import React from 'react';

export const AnnouncementTicker: React.FC = () => {
  return (
    <div className="announcement-ticker">
      <div className="container">
        <div className="ticker-content">
          <span className="ticker-badge">ข่าวสารด่วน</span>
          <div className="ticker-text" id="topTickerText">
            เปิดรับสมัครทุนการศึกษา ประจำภาคการศึกษาที่ 1 ปีการศึกษา 2567 — กรอกใบสมัครออนไลน์ได้ตั้งแต่วันนี้ถึง 31 ตุลาคม 2567
          </div>
        </div>
      </div>
    </div>
  );
};
