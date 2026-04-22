/**
 * Data Export Utilities
 * Export survey data, respondents, census, aspirations, and activity logs to CSV.
 */

import type { RespondentSample, SurveyResponse, Questionnaire, MediaMonitoring, CensusData, Aspiration } from '../types';

/**
 * Convert an array of objects to a CSV string.
 */
function toCSV(headers: string[], rows: string[][]): string {
    const escape = (val: string) => {
        if (!val) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };
    const headerLine = headers.map(escape).join(',');
    const dataLines = rows.map(row => row.map(escape).join(','));
    return [headerLine, ...dataLines].join('\n');
}

/**
 * Trigger a CSV file download in the browser.
 */
function downloadCSV(filename: string, csvContent: string) {
    // Add BOM for proper Excel UTF-8 handling
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Export respondent list to CSV.
 */
export function exportRespondents(data: RespondentSample[]) {
    const headers = ['Nama', 'NIK', 'Jenis Kelamin', 'Usia', 'Pekerjaan', 'Telepon', 'Alamat', 'Kabupaten', 'Kecamatan', 'Desa', 'RT/RW', 'Status', 'Surveyor', 'Tanggal Input'];
    const rows = data.map(r => [
        r.nama, r.nik, r.jenis_kelamin, r.usia.toString(), r.pekerjaan,
        r.no_telp, r.alamat, r.kabupaten, r.kecamatan, r.desa, r.rt_rw,
        r.status, r.assigned_surveyor || '-', r.created_at || '',
    ]);
    const csv = toCSV(headers, rows);
    downloadCSV('responden_surveyku', csv);
}

/**
 * Export survey results to CSV. Flattens questionnaire answers into columns.
 */
export function exportSurveyResults(
    responses: SurveyResponse[], 
    respondents: RespondentSample[], 
    questionnaires: Questionnaire[]
) {
    // Collect all question IDs from the questionnaires in these responses
    const relevantQuestionnaires = questionnaires.filter(q => 
        responses.some(r => r.questionnaire_id === q.id)
    );
    const allQuestions = relevantQuestionnaires.flatMap(q => q.questions);
    
    // De-duplicate questions by ID
    const uniqueQuestions = Array.from(new Map(allQuestions.map(q => [q.id, q])).values());

    const headers = [
        'ID', 'Responden', 'NIK', 'Kabupaten', 'Kecamatan', 'Desa',
        'Kuesioner', 'Surveyor', 'Status', 'Waktu Kirim',
        'GPS Lat', 'GPS Lng',
        ...uniqueQuestions.map(q => q.text),
    ];

    const rows = responses.map(r => {
        const respondent = respondents.find(resp => resp.id === r.respondent_id);
        const questionnaire = questionnaires.find(q => q.id === r.questionnaire_id);
        const answers = (r.answers || {}) as Record<string, string | string[]>;

        return [
            r.id,
            respondent?.nama || '-',
            respondent?.nik || '-',
            respondent?.kabupaten || '-',
            respondent?.kecamatan || '-',
            respondent?.desa || '-',
            questionnaire?.title || '-',
            r.surveyor_id,
            r.status,
            r.submitted_at || '-',
            r.location?.lat?.toString() || '-',
            r.location?.lng?.toString() || '-',
            ...uniqueQuestions.map(q => {
                const ans = answers[q.id];
                if (!ans) return '-';
                return Array.isArray(ans) ? ans.join('; ') : ans;
            }),
        ];
    });

    const csv = toCSV(headers, rows);
    downloadCSV('hasil_survei_surveyku', csv);
}

/**
 * Export media monitoring data to CSV.
 */
export function exportMediaMonitoring(data: MediaMonitoring[]) {
    const headers = ['ID', 'Judul', 'Sumber', 'Nama Media', 'URL', 'Konten', 'Sentimen', 'Kategori', 'Pelapor', 'Tanggal'];
    const rows = data.map(m => [
        m.id, m.title, m.source, m.media_name || '-', m.url || '-', m.content,
        m.sentiment, m.category || '-', m.reported_by, m.reported_at || '',
    ]);
    const csv = toCSV(headers, rows);
    downloadCSV('media_monitoring_surveyku', csv);
}

/**
 * Export census data to CSV.
 */
export function exportCensusData(data: CensusData[]) {
    const headers = ['ID', 'Nama', 'NIK', 'Tempat Lahir', 'Tanggal Lahir', 'Jenis Kelamin', 'Alamat', 'Kabupaten', 'Kecamatan', 'Desa', 'RT/RW', 'Agama', 'Status Kawin', 'Pendidikan', 'Pekerjaan', 'Catatan', 'Surveyor', 'Tanggal'];
    const rows = data.map(c => [
        c.id, c.respondent_name, c.nik, c.tempat_lahir, (c as any).tanggal_lahir || '',
        c.jenis_kelamin, c.alamat, c.kabupaten, c.kecamatan, c.desa,
        c.rt_rw, c.agama, c.status_perkawinan, c.pendidikan_terakhir,
        c.pekerjaan, c.catatan || '', c.surveyor_id, c.collected_at || '',
    ]);
    const csv = toCSV(headers, rows);
    downloadCSV('sensus_surveyku', csv);
}

/**
 * Export aspirations to CSV.
 */
export function exportAspirations(data: Aspiration[]) {
    const headers = ['ID', 'Pelapor', 'Kategori', 'Judul', 'Deskripsi', 'Lokasi', 'Kabupaten', 'Kecamatan', 'Desa', 'Prioritas', 'Status', 'Petugas', 'Tanggal'];
    const rows = data.map(a => [
        a.id, a.respondent_name, a.kategori, a.judul, a.deskripsi,
        a.lokasi || '-', a.kabupaten, a.kecamatan, a.desa, a.prioritas,
        a.status, a.reported_by, a.created_at || '',
    ]);
    const csv = toCSV(headers, rows);
    downloadCSV('aspirasi_surveyku', csv);
}
