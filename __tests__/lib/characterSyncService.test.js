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
  getCharacterFamiliar: jest.fn(),
  getCharacterAbility: jest.fn(),
}));

jest.mock('../../lib/db/queries.js', () => ({
  upsertCharacter: jest.fn().mockResolvedValue(undefined),
  upsertCharacterStats: jest.fn().mockResolvedValue(undefined),
  upsertEquipment: jest.fn().mockResolvedValue(undefined),
  upsertEquipmentPreset: jest.fn().mockResolvedValue(undefined),
  replaceEquipmentSnapshot: jest.fn().mockResolvedValue(undefined),
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
  upsertFamiliars: jest.fn().mockResolvedValue(undefined),
  upsertAbilities: jest.fn().mockResolvedValue(undefined),
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
  nexon.getCharacterFamiliar.mockResolvedValue({ familiar_info: [] });
  nexon.getCharacterAbility.mockResolvedValue({});
}

describe('syncCharacter - equipment snapshot', () => {
  beforeEach(() => jest.clearAllMocks());

  it('delegates the fulfilled current list unchanged with all three presets, including empty arrays', async () => {
    const currentItems = [
      { item_equipment_slot: 'ring', item_name: 'First Ring' },
      { item_equipment_slot: 'ring', item_name: 'Second Ring' },
    ];
    const preset1 = [{ item_equipment_slot: 'hat', item_name: 'Hat' }];
    await mockAllApisWithDefaults({
      equipment: {
        preset_no: '2',
        item_equipment: currentItems,
        item_equipment_preset_1: preset1,
        item_equipment_preset_2: [],
        item_equipment_preset_3: [],
      },
    });
    const { replaceEquipmentSnapshot } =
      await import('../../lib/db/queries.js');

    await syncCharacter(OCID);

    expect(replaceEquipmentSnapshot).toHaveBeenCalledWith(
      OCID,
      2,
      currentItems,
      {
        1: preset1,
        2: [],
        3: [],
      }
    );
  });

  it('clears the equipment snapshot when Nexon fulfills an empty response', async () => {
    await mockAllApisWithDefaults({
      equipment: {
        preset_no: '1',
        item_equipment: [],
        item_equipment_preset_1: [],
        item_equipment_preset_2: [],
        item_equipment_preset_3: [],
      },
    });
    const { replaceEquipmentSnapshot } =
      await import('../../lib/db/queries.js');

    await syncCharacter(OCID);

    expect(replaceEquipmentSnapshot).toHaveBeenCalledWith(OCID, 1, [], {
      1: [],
      2: [],
      3: [],
    });
  });

  it('does not clear equipment when its upstream request rejects', async () => {
    await mockAllApisWithDefaults();
    const nexon = await import('../../lib/nexonApi.js');
    const { replaceEquipmentSnapshot } =
      await import('../../lib/db/queries.js');
    nexon.getCharacterEquipment.mockRejectedValue(new Error('upstream failed'));

    await syncCharacter(OCID);

    expect(replaceEquipmentSnapshot).not.toHaveBeenCalled();
  });
});

describe('syncCharacter - authoritative empty snapshots', () => {
  beforeEach(() => jest.clearAllMocks());

  it('replaces fulfilled empty link, set-effect, and pet snapshots', async () => {
    await mockAllApisWithDefaults({
      linkSkill: {
        use_preset_no: '1',
        character_link_skill_preset_1: [],
        character_link_skill_preset_2: [],
        character_link_skill_preset_3: [],
      },
      pet: {},
    });
    const { upsertLinkSkills, upsertSetEffects, upsertPetEquipment } =
      await import('../../lib/db/queries.js');

    await syncCharacter(OCID);

    expect(upsertLinkSkills).toHaveBeenCalledWith(OCID, 1, []);
    expect(upsertLinkSkills).toHaveBeenCalledWith(OCID, 2, []);
    expect(upsertLinkSkills).toHaveBeenCalledWith(OCID, 3, []);
    expect(upsertSetEffects).toHaveBeenCalledWith(OCID, []);
    expect(upsertPetEquipment).toHaveBeenCalledWith(OCID, []);
  });

  it('does not clear link, set-effect, or pet rows when upstream requests reject', async () => {
    await mockAllApisWithDefaults();
    const nexon = await import('../../lib/nexonApi.js');
    const { upsertLinkSkills, upsertSetEffects, upsertPetEquipment } =
      await import('../../lib/db/queries.js');
    nexon.getCharacterLinkSkill.mockRejectedValue(
      new Error('link upstream failed')
    );
    nexon.getCharacterSetEffect.mockRejectedValue(
      new Error('set upstream failed')
    );
    nexon.getCharacterPetEquipment.mockRejectedValue(
      new Error('pet upstream failed')
    );

    await syncCharacter(OCID);

    expect(upsertLinkSkills).not.toHaveBeenCalled();
    expect(upsertSetEffects).not.toHaveBeenCalled();
    expect(upsertPetEquipment).not.toHaveBeenCalled();
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

  it('clears pet equipment when the fulfilled response has no pets', async () => {
    await mockAllApisWithDefaults({ pet: {} });
    const { upsertPetEquipment } = await import('../../lib/db/queries.js');

    await syncCharacter(OCID);

    expect(upsertPetEquipment).toHaveBeenCalledWith(OCID, []);
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
