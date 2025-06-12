// Type definitions for audit form data structure
// These types match the database schema and form structure

export interface AuditData {
  // Customer Information
  customerFirstName?: string;
  customerLastName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerCity?: string;
  customerProvince?: string;
  customerPostalCode?: string;
  auditType?: string; // before_upgrade, after_upgrade
  homeType?: string; // single_detached, attached, row_end, row_mid
  auditDate?: string;

  // Pre-audit Information
  eligibilityCriteria?: {
    registered?: boolean;
    documents?: boolean;
    storeys?: boolean;
    size?: boolean;
    foundation?: boolean;
    mechanical?: boolean;
    doors_windows?: boolean;
    envelope?: boolean;
    renovations?: boolean;
    ashes?: boolean;
    electrical?: boolean;
  };

  preAuditDiscussion?: {
    authorization?: boolean;
    process?: boolean;
    access?: boolean;
    documents?: boolean;
  };

  atypicalLoads?: {
    deicing?: boolean;
    lighting?: boolean;
    hot_tub?: boolean;
    air_conditioner?: boolean;
    pool?: boolean;
  };

  // House Information
  houseInfo?: {
    houseType?: string; // bungalow, 2_storey, bi_level, split_level
    yearBuilt?: string;
    aboveGradeHeight?: string;
    aboveGradeHeightUnit?: string; // m, ft
    aboveGradeFeet?: string;
    aboveGradeInches?: string;
    frontOrientation?: string; // N, NW, W, SW, S, SE, E, NE
  };

  foundationInfo?: {
    foundationType?: string[]; // basement, crawlspace, slab
    crawlspaceType?: string; // open, closed, vented
    sheathingType?: string;
    sheathingThickness?: string;
    wallHeight?: string;
    wallHeightUnit?: string; // m, ft
    averageHeightAboveGrade?: string;
    ponyWall?: string; // yes, no
    corners?: string;
    walls?: string; // concrete, pwf, mason_block, other
    interiorWalls?: string[]; // full_height, half_height, other
    interiorWallConstruction?: string; // wood, metal, dimension, other
    framingSpacing?: string[]; // 16, 19.2, 24
    insulation?: string; // fibreglass, mineral_wool, foam, other
    insulationThickness?: string; // 1, 1.5, 2, 3, 3.5, 5.5, other
    slabInsulation?: string; // yes, no
    slabInsulationType?: string;
    slabInsulationThickness?: string;
    slabHeated?: string; // yes, no
  };

  wallsInfo?: {
    floors?: Array<{
      id: string;
      name: string; // basement, main, second, third, etc.
      wallHeight?: string;
      wallHeightUnit?: string; // m, ft
      wallHeightFeet?: string;
      wallHeightInches?: string;
    }>;
    wallFraming?: string; // 2x4, 2x6, 2x8, other
    centres?: string; // 16, 19.2, 24, other
    cavityInsulation?: string[]; // R18, R10, R12, R19, R22, R24, other
    exteriorInsulationType?: string[]; // eps, xps, mineral_wool
    exteriorInsulationThickness?: string;
    exteriorSheathing?: string; // osb, ply, gypsum, other
    sheathingThickness?: string; // 3/8, 7/16, 1/2, other
    exteriorFinish?: string; // vinyl, fibreboard, stone_brick, stucco, other
    exteriorFinishOther?: string;
    studsCorner?: string; // yes, no
    corners?: {
      main?: string;
      second?: string;
      third?: string;
    };
    intersections?: {
      main?: string;
      second?: string;
      third?: string;
    };
    studCornerType?: string[]; // knee_wall, gable_end_wall, skylight_wall
  };

  ceilingInfo?: {
    atticFraming?: string; // wood, metal, truss, rafters, 2x4, 2x6, other
    atticInsulationType?: string[]; // fibreglass, cellulose, foam
    atticInsulationThickness?: string;
    ceilingType?: string; // flat, cathedral, scissor, attic_gable, attic_hip
    spacing?: string; // 16, 19.2, 24, other
  };

  windowsInfo?: {
    frame?: string; // wood, aluminum, pvc, fibreglass
    lowECoating?: string; // none, 1, 2
    gasFill?: string; // yes, no
    lintelType?: string; // single_angle_steel, double_angle_steel, engineered_custom, not_shown_na
    glazing?: string; // 1, 2, 3
  };

  doorsInfo?: {
    skin?: string; // steel, wood, fibreglass
    insulation?: string; // fibreglass, eps, xps, spray_foam
  };

  ventilationInfo?: {
    ventilationType?: string; // exhaust_only, supply_only, balanced
    device?: {
      bathFan?: { cfm?: string };
      rangeHood?: { cfm?: string };
      utilityFan?: { cfm?: string };
    };
    hrvManufacturer?: string;
    hrvModel?: string;
    hviCertified?: string; // yes, no
    hrvCfm?: {
      supply?: string;
      exhaust?: string;
    };
    fanPower?: {
      at0C?: string;
      atMinus25?: string;
    };
    sensibleEfficiency?: {
      at0C?: string;
      atMinus25C?: string;
    };
    bathFanDetails?: {
      manufacturer?: string;
      model?: string;
      exhaustFlow?: string;
      fanPower?: string;
    };
    utilityFanDetails?: {
      manufacturer?: string;
      flowRate?: string;
    };
    rangeHoodDetails?: {
      manufacturer?: string;
    };
  };

  heatingInfo?: {
    heatingSystemType?: string[]; // furnace, boiler, combo, integrated, csa_p9_11, heat_pump
    source?: string; // ng, propane, electric, oil
    manufacturer?: string;
    model?: string;
    ratedEfficiency?: {
      overall?: string;
      afue?: string;
      steadyState?: string;
    };
    ignitionType?: string; // pilot, electric_ignition
    automaticVentDamper?: string; // yes_motorized, no_fixed_barometric, na_sealed_combustion
    dedicatedCombustionAirDuct?: string;
    fanPumpMotorType?: string; // ecm_motor, psc_motor, vfd_motor
    ventingConfiguration?: string; // induced_draft, sealed_combustion, furnace_with_pilot, condensing
    heatPumpManufacturer?: string;
    heatPumpModel?: string;
    supplementaryHeatingSystem?: string;
    acCoil?: string;
    condenserUnit?: string;
  };

  domesticHotWaterInfo?: {
    domesticHotWaterType?: string; // conv_tank, tankless, induced_direct_vent, cond_tank, tankless_coil, conserver, heat_pump
    fuel?: string; // electric, nat_gas, propane, oil, other
    manufacturer?: string;
    model?: string;
    tankVolume?: string;
    efficiencyFactor?: string;
    cop?: string;
    pilot?: string; // yes, no
    coVented?: string; // yes, no
    flueDiameter?: string;
    showersToMainStack?: string;
    dwhr?: {
      present?: string; // yes, no
      manufacturer?: string;
      model?: string;
      size?: string;
    };
    dwhrToShower?: string; // yes, no
    lowFlushToilets?: string;
  };

  renewablesInfo?: {
    solarPv?: {
      present?: string; // yes, no
      manufacturer?: string;
      area?: string;
      slope?: string;
      azimuth?: string;
      moduleType?: string[]; // mono_si, poly_si, a_si, cd_te, cis
    };
    solarDhw?: {
      manufacturer?: string;
      model?: string;
      csaF379Rating?: string;
      slope?: string;
      azimuth?: string;
    };
  };

  // Tests
  blowerDoorTest?: {
    areasOfLeakage?: {
      rims?: boolean;
      electric_outlet?: boolean;
      doors?: boolean;
      wall_intersections?: boolean;
      baseboards?: boolean;
      ceiling_fixtures?: boolean;
      window_frames?: boolean;
      electric_panel?: boolean;
      attic_access?: boolean;
    };
    windowComponent?: string;
    other?: string;
  };

  depressurizationTest?: {
    windowLeakage?: string; // yes, no
    otherLeakage?: string;
  };

  // Additional metadata
  status?: string; // draft, in_progress, completed
}

// Photo category types
export type PhotoCategory = 
  | "exterior"
  | "heating_system" 
  | "hot_water"
  | "hrv_erv"
  | "renewables"
  | "attic_insulation"
  | "blower_door";

// Form validation types
export interface FormValidationError {
  field: string;
  message: string;
}

// Export types for PDF and HOT2000
export interface ExportOptions {
  includePdf?: boolean;
  includeHot2000?: boolean;
  includePhotos?: boolean;
}

// HOT2000 file structure
export interface HOT2000Data {
  houseName: string;
  location: string;
  yearBuilt: string;
  houseType: string;
  wallMaterial: string;
  wallInsulation: string;
  wallHeight: string;
  windowType: string;
  windowFrame: string;
  windowUValue: string;
  foundationType: string;
  foundationInsulation: string;
  heatingSystem: string;
  heatingFuel: string;
  heatingEfficiency: string;
  ventilationType: string;
  hrvPresent: string;
}
