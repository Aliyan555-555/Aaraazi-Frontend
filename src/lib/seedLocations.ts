/**
 * Seed Location Data for Naya Nazimabad, Karachi
 * 
 * This file contains comprehensive location data for Naya Nazimabad,
 * a large planned residential community in Karachi.
 * 
 * Structure:
 * - 1 City: Karachi
 * - 1 Main Area: Naya Nazimabad
 * - 12 Blocks: A, B, C, D, E, F, G, H, I, J, K, L
 * - Sample buildings in each block
 */

import { City, Area, Block, Building } from '../types/locations';

// ==================== CITY ====================

export const seedCities: City[] = [
  {
    id: 'city_karachi',
    name: 'Karachi',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// ==================== AREAS ====================

export const seedAreas: Area[] = [
  {
    id: 'area_naya_nazimabad',
    name: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// ==================== BLOCKS ====================

export const seedBlocks: Block[] = [
  // Block A
  {
    id: 'block_nn_a',
    name: 'Block A',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Block B
  {
    id: 'block_nn_b',
    name: 'Block B',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Block C
  {
    id: 'block_nn_c',
    name: 'Block C',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Block D
  {
    id: 'block_nn_d',
    name: 'Block D',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Block E
  {
    id: 'block_nn_e',
    name: 'Block E',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Block F
  {
    id: 'block_nn_f',
    name: 'Block F',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Block G
  {
    id: 'block_nn_g',
    name: 'Block G',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Block H
  {
    id: 'block_nn_h',
    name: 'Block H',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Block I
  {
    id: 'block_nn_i',
    name: 'Block I',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Block J
  {
    id: 'block_nn_j',
    name: 'Block J',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Block K
  {
    id: 'block_nn_k',
    name: 'Block K',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Block L
  {
    id: 'block_nn_l',
    name: 'Block L',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ==================== BUILDINGS ====================

export const seedBuildings: Building[] = [
  // Block A Buildings
  {
    id: 'building_nn_a_1',
    name: 'Al-Hafeez Heights',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    blockId: 'block_nn_a',
    blockName: 'Block A',
    totalFloors: 10,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'building_nn_a_2',
    name: 'Emerald Residency',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    blockId: 'block_nn_a',
    blockName: 'Block A',
    totalFloors: 8,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'building_nn_a_3',
    name: 'Paradise Towers',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    blockId: 'block_nn_a',
    blockName: 'Block A',
    totalFloors: 12,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // Block B Buildings
  {
    id: 'building_nn_b_1',
    name: 'Royal Palace',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    blockId: 'block_nn_b',
    blockName: 'Block B',
    totalFloors: 9,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'building_nn_b_2',
    name: 'Green Valley',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    blockId: 'block_nn_b',
    blockName: 'Block B',
    totalFloors: 7,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Block C Buildings
  {
    id: 'building_nn_c_1',
    name: 'Silver Oaks',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    blockId: 'block_nn_c',
    blockName: 'Block C',
    totalFloors: 11,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'building_nn_c_2',
    name: 'Golden Heights',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    blockId: 'block_nn_c',
    blockName: 'Block C',
    totalFloors: 8,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Block D Buildings
  {
    id: 'building_nn_d_1',
    name: 'Pearl Residency',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    blockId: 'block_nn_d',
    blockName: 'Block D',
    totalFloors: 10,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'building_nn_d_2',
    name: 'Diamond Plaza',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    blockId: 'block_nn_d',
    blockName: 'Block D',
    totalFloors: 6,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Block E Buildings
  {
    id: 'building_nn_e_1',
    name: 'Sunrise Apartments',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    blockId: 'block_nn_e',
    blockName: 'Block E',
    totalFloors: 9,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'building_nn_e_2',
    name: 'Sunset Residency',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    blockId: 'block_nn_e',
    blockName: 'Block E',
    totalFloors: 12,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Block F Buildings
  {
    id: 'building_nn_f_1',
    name: 'Star Complex',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    blockId: 'block_nn_f',
    blockName: 'Block F',
    totalFloors: 8,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'building_nn_f_2',
    name: 'Moon Plaza',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    blockId: 'block_nn_f',
    blockName: 'Block F',
    totalFloors: 7,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Block G Buildings
  {
    id: 'building_nn_g_1',
    name: 'Maple Heights',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    blockId: 'block_nn_g',
    blockName: 'Block G',
    totalFloors: 10,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'building_nn_g_2',
    name: 'Pine Residency',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    blockId: 'block_nn_g',
    blockName: 'Block G',
    totalFloors: 11,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Block H Buildings
  {
    id: 'building_nn_h_1',
    name: 'Ocean View',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    blockId: 'block_nn_h',
    blockName: 'Block H',
    totalFloors: 9,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'building_nn_h_2',
    name: 'Lake Shore Apartments',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    blockId: 'block_nn_h',
    blockName: 'Block H',
    totalFloors: 8,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Block I Buildings
  {
    id: 'building_nn_i_1',
    name: 'Victoria Tower',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    blockId: 'block_nn_i',
    blockName: 'Block I',
    totalFloors: 12,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'building_nn_i_2',
    name: 'Crystal Heights',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    blockId: 'block_nn_i',
    blockName: 'Block I',
    totalFloors: 10,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Block J Buildings (Commercial Zone)
  {
    id: 'building_nn_j_1',
    name: 'Naya Nazimabad Shopping Mall',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    blockId: 'block_nn_j',
    blockName: 'Block J',
    totalFloors: 4,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'building_nn_j_2',
    name: 'Business Bay Plaza',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    blockId: 'block_nn_j',
    blockName: 'Block J',
    totalFloors: 5,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Block K Buildings
  {
    id: 'building_nn_k_1',
    name: 'Grand Arcade',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    blockId: 'block_nn_k',
    blockName: 'Block K',
    totalFloors: 7,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'building_nn_k_2',
    name: 'Elite Residency',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    blockId: 'block_nn_k',
    blockName: 'Block K',
    totalFloors: 9,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Block L Buildings
  {
    id: 'building_nn_l_1',
    name: 'Heritage Plaza',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    blockId: 'block_nn_l',
    blockName: 'Block L',
    totalFloors: 8,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'building_nn_l_2',
    name: 'Landmark Towers',
    areaId: 'area_naya_nazimabad',
    areaName: 'Naya Nazimabad',
    cityId: 'city_karachi',
    cityName: 'Karachi',
    blockId: 'block_nn_l',
    blockName: 'Block L',
    totalFloors: 11,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ==================== SUMMARY ====================
/**
 * Total Seed Data:
 * - 1 City (Karachi)
 * - 1 Area (Naya Nazimabad)
 * - 12 Blocks (A through L)
 * - 24 Buildings (2 per block)
 * 
 * This provides a comprehensive foundation for property management
 * in Naya Nazimabad, with room for expansion.
 */
