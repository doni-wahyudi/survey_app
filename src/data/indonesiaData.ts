// ==========================================
// Indonesia Area API Service
// Using public API from emsifa.com
// ==========================================

const API_BASE = 'https://www.emsifa.com/api-wilayah-indonesia/api';

// Simple in-memory cache
const cache: Record<string, any> = {};

async function fetchWithCache(url: string) {
    if (cache[url]) return cache[url];
    try {
        const response = await fetch(url);
        const data = await response.json();
        cache[url] = data;
        return data;
    } catch (error) {
        console.error('Error fetching region data:', error);
        return [];
    }
}

export interface Region {
    id: string;
    name: string;
}

export async function fetchProvinsi(): Promise<Region[]> {
    return fetchWithCache(`${API_BASE}/provinces.json`);
}

export async function fetchKabupaten(provinsiId: string): Promise<Region[]> {
    if (!provinsiId) return [];
    return fetchWithCache(`${API_BASE}/regencies/${provinsiId}.json`);
}

export async function fetchKecamatan(kabupatenId: string): Promise<Region[]> {
    if (!kabupatenId) return [];
    return fetchWithCache(`${API_BASE}/districts/${kabupatenId}.json`);
}

export async function fetchDesa(kecamatanId: string): Promise<Region[]> {
    if (!kecamatanId) return [];
    return fetchWithCache(`${API_BASE}/villages/${kecamatanId}.json`);
}

// Helper to get ID from Name if needed (though using IDs is better)
export async function getProvinsiIdByName(name: string): Promise<string | null> {
    const list = await fetchProvinsi();
    const found = list.find(p => p.name.toLowerCase() === name.toLowerCase());
    return found ? found.id : null;
}

// Fallback for existing static data compatibility if needed
export const INDONESIA_REGIONS = []; // No longer used as static
