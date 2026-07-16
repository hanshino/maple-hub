import { syncCharacter } from '../../lib/characterSyncService.js';

jest.mock('../../lib/nexonApi.js', () => ({
  getCharacterBasicInfo: jest.fn(),
  getCharacterOcid: jest.fn(),
  getCharacterStats: jest.fn(),
  getCharacterEquipment: jest.fn(),
  getCharacterCashItemEquipment: jest.fn(),
  getCharacterPetEquipment: jest.fn(),
  getCharacterHyperStat: jest.fn(),
  getCharacterLinkSkill: jest.fn(),
  getCharacterHexaMatrix: jest.fn(),
  getCharacterHexaMatrixStat: jest.fn(),
  getCharacterSetEffect: jest.fn(),
  getCharacterSymbolEquipment: jest.fn(),
  getUnionRaider: jest.fn(),
  getUnionArtifact: jest.fn(),
  getCharacterUnion: jest.fn(),
  getUnionChampion: jest.fn(),
}));

jest.mock('../../lib/db/queries.js', () => ({
  upsertCharacter: jest.fn().mockResolvedValue(undefined),
  upsertCharacterStats: jest.fn().mockResolvedValue(undefined),
  upsertEquipment: jest.fn().mockResolvedValue(undefined),
  upsertEquipmentPreset: jest.fn().mockResolvedValue(undefined),
  upsertHyperStats: jest.fn().mockResolvedValue(undefined),
  upsertHyperStatPreset: jest.fn().mockResolvedValue(undefined),
  upsertLinkSkills: jest.fn().mockResolvedValue(undefined),
  upsertLinkSkillPreset: jest.fn().mockResolvedValue(undefined),
  upsertHexaCores: jest.fn().mockResolvedValue(undefined),
  upsertHexaStats: jest.fn().mockResolvedValue(undefined),
  upsertSymbols: jest.fn().mockResolvedValue(undefined),
  upsertSetEffects: jest.fn().mockResolvedValue(undefined),
  upsertUnion: jest.fn().mockResolvedValue(undefined),
  upsertUnionRaiderStats: jest.fn().mockResolvedValue(undefined),
  upsertUnionArtifacts: jest.fn().mockResolvedValue(undefined),
  upsertUnionArtifactEffects: jest.fn().mockResolvedValue(undefined),
  upsertUnionChampion: jest.fn().mockResolvedValue(undefined),
  upsertCashEquipment: jest.fn().mockResolvedValue(undefined),
  upsertPetEquipment: jest.fn().mockResolvedValue(undefined),
  incrementNotFoundCount: jest.fn().mockResolvedValue(undefined),
  getCharacterByOcid: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../lib/rateLimiter.js', () => ({
  getGlobalRateLimiter: jest.fn(() => ({
    execute: jest.fn(fn => fn()),
  })),
}));

const OCID = 'test-ocid';

async function mockAllApisWithDefaults(overrides = {}) {
  const nexon = await import('../../lib/nexonApi.js');

  nexon.getCharacterBasicInfo.mockResolvedValue({
    character_name: 'TestChar',
    character_level: 275,
    character_class: '聖騎士',
    character_class_level: '6',
    world_name: '艾麗亞',
    character_image: 'https://example.com/img.png',
  });
  nexon.getCharacterStats.mockResolvedValue({
    final_stat: [{ stat_name: '戰鬥力', stat_value: '100000' }],
  });
  nexon.getCharacterEquipment.mockResolvedValue(
    overrides.equipment ?? {
      preset_no: 1,
      item_equipment_preset_1: [],
      item_equipment_preset_2: [],
      item_equipment_preset_3: [],
    }
  );
  nexon.getCharacterCashItemEquipment.mockResolvedValue({
    cash_item_equipment_base: [],
  });
  nexon.getCharacterPetEquipment.mockResolvedValue(overrides.pet ?? {});
  nexon.getCharacterHyperStat.mockResolvedValue({
    use_preset_no: '1',
    hyper_stat_preset_1: [],
  });
  nexon.getCharacterLinkSkill.mockResolvedValue(
    overrides.linkSkill ?? {
      use_preset_no: '1',
      character_link_skill_preset_1: [],
    }
  );
  nexon.getCharacterHexaMatrix.mockResolvedValue({});
  nexon.getCharacterHexaMatrixStat.mockResolvedValue({});
  nexon.getCharacterSetEffect.mockResolvedValue({ set_effect: [] });
  nexon.getCharacterSymbolEquipment.mockResolvedValue({ symbol: [] });
  nexon.getUnionRaider.mockResolvedValue({ union_raider_stat: [] });
  nexon.getUnionArtifact.mockResolvedValue({
    union_artifact_crystal: [],
    union_artifact_effect: [],
  });
  nexon.getCharacterUnion.mockResolvedValue({ union_level: 1 });
  nexon.getUnionChampion.mockResolvedValue({ union_champion: [] });
}

describe('syncCharacter - equipment preset', () => {
  beforeEach(() => jest.clearAllMocks());

  it('persists the active preset number reported by Nexon', async () => {
    await mockAllApisWithDefaults({
      equipment: {
        preset_no: 2,
        item_equipment_preset_1: [],
        item_equipment_preset_2: [{ item_name: 'A' }],
        item_equipment_preset_3: [],
      },
    });
    const { upsertEquipmentPreset } = await import('../../lib/db/queries.js');

    const result = await syncCharacter(OCID);

    expect(result.success).toBe(true);
    expect(upsertEquipmentPreset).toHaveBeenCalledWith(OCID, 2);
  });

  it('defaults to preset 1 when Nexon omits preset_no', async () => {
    await mockAllApisWithDefaults({
      equipment: {
        item_equipment_preset_1: [],
        item_equipment_preset_2: [],
        item_equipment_preset_3: [],
      },
    });
    const { upsertEquipmentPreset } = await import('../../lib/db/queries.js');

    await syncCharacter(OCID);

    expect(upsertEquipmentPreset).toHaveBeenCalledWith(OCID, 1);
  });
});

describe('syncCharacter - pet equipment fields', () => {
  beforeEach(() => jest.clearAllMocks());

  it('passes through the new Nexon pet fields to upsertPetEquipment', async () => {
    await mockAllApisWithDefaults({
      pet: {
        pet_1_name: 'Pinky Pig',
        pet_1_nickname: '小粉',
        pet_1_icon: 'icon.png',
        pet_1_description: 'desc',
        pet_1_pet_type: '神奇寵物',
        pet_1_equipment: { item_name: 'X' },
        pet_1_auto_skill: { skill_1: 'A' },
        pet_1_skill: ['A', 'B'],
        pet_1_date_expire: '2099-01-01T00:00:00.000Z',
        pet_1_appearance: '粉紅豬',
        pet_1_appearance_icon: 'appearance.png',
      },
    });
    const { upsertPetEquipment } = await import('../../lib/db/queries.js');

    await syncCharacter(OCID);

    expect(upsertPetEquipment).toHaveBeenCalledWith(OCID, [
      expect.objectContaining({
        pet_name: 'Pinky Pig',
        pet_nickname: '小粉',
        pet_description: 'desc',
        pet_type: '神奇寵物',
        pet_auto_skill: { skill_1: 'A' },
        pet_skill: ['A', 'B'],
        pet_date_expire: '2099-01-01T00:00:00.000Z',
        pet_appearance: '粉紅豬',
        pet_appearance_icon: 'appearance.png',
      }),
    ]);
  });

  it('does not call upsertPetEquipment when the character has no pets', async () => {
    await mockAllApisWithDefaults({ pet: {} });
    const { upsertPetEquipment } = await import('../../lib/db/queries.js');

    await syncCharacter(OCID);

    expect(upsertPetEquipment).not.toHaveBeenCalled();
  });
});

describe('syncCharacter - character_owned_link_skill', () => {
  beforeEach(() => jest.clearAllMocks());

  it('passes the owned link skill through to upsertLinkSkillPreset', async () => {
    const ownedSkill = { skill_name: '聖騎士的信念', skill_level: 3 };
    await mockAllApisWithDefaults({
      linkSkill: {
        use_preset_no: '1',
        character_link_skill_preset_1: [],
        character_owned_link_skill: ownedSkill,
      },
    });
    const { upsertLinkSkillPreset } = await import('../../lib/db/queries.js');

    await syncCharacter(OCID);

    expect(upsertLinkSkillPreset).toHaveBeenCalledWith(OCID, 1, ownedSkill);
  });

  it('passes null when Nexon has no owned link skill for this character', async () => {
    await mockAllApisWithDefaults({
      linkSkill: { use_preset_no: '1', character_link_skill_preset_1: [] },
    });
    const { upsertLinkSkillPreset } = await import('../../lib/db/queries.js');

    await syncCharacter(OCID);

    expect(upsertLinkSkillPreset).toHaveBeenCalledWith(OCID, 1, null);
  });
});
