import { Application } from '../types/application';
import { Scholarship } from '../types/scholarship';
import { normalizeStudentId } from './studentId';

export type ApplicationRecommendationType =
  | 'recommended'
  | 'many-applications'
  | 'low-gpa'
  | 'incomplete'
  | 'needs-review'
  | 'not-eligible'
  | 'automatic-rejection';

export interface ApplicationRecommendation {
  type: ApplicationRecommendationType;
  label: string;
  details: string[];
  priority: number;
  termApplicationCount: number;
  hasSocialActivities: boolean;
  volunteerHours: number;
}

export const shouldAutomaticallyRejectApplication = (
  recommendation: ApplicationRecommendation | undefined
): boolean =>
  recommendation?.type === 'automatic-rejection' ||
  recommendation?.type === 'not-eligible';

export const getAutomaticRejectionNotes = (
  existingNotes: string,
  recommendation: ApplicationRecommendation
): string => [
  existingNotes.trim(),
  `ระบบกำหนดสถานะไม่ผ่านการพิจารณา: ${recommendation.details.join(' · ')}`
].filter(Boolean).join('\n');

const SAME_TERM_APPLICATION_LIMIT = 3;

const findScholarship = (app: Application, scholarships: Scholarship[]) =>
  scholarships.find(scholarship => scholarship.id === app.scholarshipId) ??
  scholarships.find(scholarship =>
    scholarship.title === app.scholarshipName ||
    (app.scholarshipName.length > 0 && (
      app.scholarshipName.includes(scholarship.title) ||
      scholarship.title.includes(app.scholarshipName)
    ))
  );

export const buildApplicationRecommendations = (
  applications: Application[],
  scholarships: Scholarship[]
): Map<string, ApplicationRecommendation> => {
  const scholarshipByApplication = new Map(
    applications.map(app => [app.trackingId, findScholarship(app, scholarships)])
  );
  const termApplicationCounts = new Map<string, number>();

  applications.forEach(app => {
    const scholarship = scholarshipByApplication.get(app.trackingId);
    const studentId = normalizeStudentId(app.studentId);
    if (!scholarship || !studentId) return;

    const key = `${studentId}|${scholarship.academicYear}|${scholarship.term}`;
    termApplicationCounts.set(key, (termApplicationCounts.get(key) ?? 0) + 1);
  });

  return new Map(applications.map(app => {
    const scholarship = scholarshipByApplication.get(app.trackingId);
    const formData = app.formData;
    const studentId = normalizeStudentId(app.studentId);
    const termKey = scholarship && studentId
      ? `${studentId}|${scholarship.academicYear}|${scholarship.term}`
      : '';
    const termApplicationCount = termKey ? termApplicationCounts.get(termKey) ?? 1 : 1;
    const reason = formData?.reason?.trim() || formData?.reasonsList?.some(item => item.trim());
    const hasSupportingDocuments = Array.isArray(app.documents) &&
      app.documents.some(document => document.trim());
    const hasProfilePhoto = Boolean(app.profilePhoto?.trim());
    const hasValidGpax = typeof app.gpax === 'number' && Number.isFinite(app.gpax);
    const missingFields = [
      !hasProfilePhoto && 'รูปโปรไฟล์',
      !reason && 'เหตุผลความจำเป็น',
      !app.studentId?.trim() && 'รหัสนักศึกษา',
      !app.fullName?.trim() && 'ชื่อ-นามสกุล',
      !app.major?.trim() && 'สาขาวิชา',
      !app.year?.trim() && 'ชั้นปี',
      !hasValidGpax && 'GPAX',
      !app.phone?.trim() && 'เบอร์โทรศัพท์',
      !app.email?.trim() && 'อีเมล'
    ].filter((field): field is string => Boolean(field));

    const eligibilityIssues: string[] = [];
    const reviewIssues: string[] = [];
    const lowerPriorityIssues: string[] = [];
    const suggestedFailIssues: string[] = [];

    if (!hasProfilePhoto) {
      suggestedFailIssues.push('ไม่มีรูปโปรไฟล์');
    }
    if (!reason && !hasSupportingDocuments) {
      suggestedFailIssues.push('ไม่มีทั้งเหตุผลและเอกสารประกอบ');
    } else if (!reason) {
      lowerPriorityIssues.push('ไม่ระบุเหตุผลความจำเป็น');
    }

    if (!scholarship) {
      reviewIssues.push('ไม่พบข้อมูลทุนเพื่อเทียบเกณฑ์');
    } else {
      if (typeof scholarship.minGPAX === 'number' && hasValidGpax && app.gpax < scholarship.minGPAX) {
        const gpaxGap = Number((scholarship.minGPAX - app.gpax).toFixed(2));
        if (gpaxGap <= 0.5) {
          lowerPriorityIssues.push(`GPAX ต่ำกว่าเกณฑ์ ${scholarship.minGPAX.toFixed(2)} อยู่ ${gpaxGap.toFixed(2)} คะแนน`);
        } else {
          suggestedFailIssues.push(`GPAX ต่ำกว่าเกณฑ์ ${scholarship.minGPAX.toFixed(2)} เกิน 0.50 คะแนน`);
        }
      }
      if (scholarship.targetYears.length > 0 && !scholarship.targetYears.includes(app.year)) {
        eligibilityIssues.push('ชั้นปีไม่ตรงกับสิทธิ์สมัคร');
      }
      if (typeof scholarship.minVolunteerHours === 'number') {
        const hours = formData?.volunteerHours;
        if (typeof hours !== 'number' || !Number.isFinite(hours)) {
          reviewIssues.push('ไม่มีข้อมูลชั่วโมงกิจกรรมให้ตรวจสอบ');
        } else if (hours < scholarship.minVolunteerHours) {
          eligibilityIssues.push(`ชั่วโมงกิจกรรมต่ำกว่าเกณฑ์ ${scholarship.minVolunteerHours} ชั่วโมง`);
        }
      }
    }

    const activities = formData?.activityList?.filter(activity =>
      activity.name.trim() || activity.role.trim()
    ).length ?? 0;
    const hasSocialActivities = activities > 0 || Boolean(formData?.activities?.trim());
    const volunteerHours = typeof formData?.volunteerHours === 'number' && Number.isFinite(formData.volunteerHours)
      ? formData.volunteerHours
      : 0;

    let type: ApplicationRecommendationType;
    let label: string;
    let priority = 0;
    const details: string[] = [];

    if (suggestedFailIssues.length > 0) {
      type = 'automatic-rejection';
      label = 'ไม่ผ่านการพิจารณา';
      priority += 5;
      details.push(...suggestedFailIssues);
    } else if (eligibilityIssues.length > 0) {
      type = 'not-eligible';
      label = 'ไม่ผ่านเกณฑ์ทุน';
      priority += 4;
      details.push(...eligibilityIssues);
    } else if (reviewIssues.length > 0) {
      type = 'needs-review';
      label = 'ต้องตรวจสอบเกณฑ์';
      priority += 2;
      details.push(...reviewIssues);
    } else if (missingFields.length > 0) {
      type = 'incomplete';
      label = 'ข้อมูลไม่ครบ';
      priority += 3;
      details.push(`ขาด: ${missingFields.join(', ')}`);
    } else if (lowerPriorityIssues.length > 0) {
      type = 'low-gpa';
      label = 'ลำดับต่ำ: ควรตรวจสอบ';
      priority += 2;
      details.push(...lowerPriorityIssues);
    } else if (termApplicationCount >= SAME_TERM_APPLICATION_LIMIT) {
      type = 'many-applications';
      label = 'สมัครหลายทุนในเทอมนี้';
      priority += 1;
    } else {
      type = 'recommended';
      label = 'แนะนำให้พิจารณาก่อน';
      details.push('ข้อมูลครบและผ่านเกณฑ์ที่ตรวจสอบได้');
    }

    if (missingFields.length > 0 && type !== 'incomplete') {
      details.push(`ข้อมูลขาด: ${missingFields.join(', ')}`);
    }
    details.push(...lowerPriorityIssues.filter(issue => !details.includes(issue)));
    details.push(...eligibilityIssues.filter(issue => !details.includes(issue)));
    details.push(...reviewIssues.filter(issue => !details.includes(issue)));
    if (termApplicationCount >= SAME_TERM_APPLICATION_LIMIT) {
      priority += 1;
      details.push(`สมัครแล้ว ${termApplicationCount} ทุนในเทอมนี้`);
    }

    if (hasSocialActivities) {
      details.push(volunteerHours > 0
        ? `มีกิจกรรม/จิตอาสา ${volunteerHours} ชั่วโมง`
        : 'มีกิจกรรมเพื่อสังคม');
    } else if (type === 'recommended' || type === 'many-applications') {
      details.push('ไม่พบข้อมูลกิจกรรมเพื่อสังคม');
    }

    return [app.trackingId, {
      type,
      label,
      details,
      priority,
      termApplicationCount,
      hasSocialActivities,
      volunteerHours
    }];
  }));
};

export const compareApplicationRecommendations = (
  first: ApplicationRecommendation | undefined,
  second: ApplicationRecommendation | undefined,
  firstApp: Application,
  secondApp: Application
): number => {
  const priorityDifference = (first?.priority ?? 3) - (second?.priority ?? 3);
  if (priorityDifference !== 0) return priorityDifference;

  if (
    (first?.termApplicationCount ?? 0) >= 3 &&
    (second?.termApplicationCount ?? 0) >= 3
  ) {
    const countDifference = (first?.termApplicationCount ?? 0) - (second?.termApplicationCount ?? 0);
    if (countDifference !== 0) return countDifference;
  }

  const gpaxDifference = Number(secondApp.gpax) - Number(firstApp.gpax);
  if (Number.isFinite(gpaxDifference) && gpaxDifference !== 0) return gpaxDifference;

  const firstHasActivities = first?.hasSocialActivities ?? false;
  const secondHasActivities = second?.hasSocialActivities ?? false;
  if (firstHasActivities !== secondHasActivities) {
    return firstHasActivities ? -1 : 1;
  }
  return (second?.volunteerHours ?? 0) - (first?.volunteerHours ?? 0);
};
