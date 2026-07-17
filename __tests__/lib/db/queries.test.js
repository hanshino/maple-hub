import {
  getFullCharacterData,
  upsertEquipmentPreset,
  upsertLinkSkillPreset,
  upsertPetEquipment,
} from '../../../lib/db/queries.js';
import * as schema from '../../../lib/db/schema.js';
import {
  characters,
  characterStats,
  characterEquipment,
  characterEquipmentPresets,
  characterHyperStats,
  characterHyperStatPresets,
  characterLinkSkills,
  characterLinkSkillPresets,
  characterHexaCores,
  characterHexaStats,
  characterSymbols,
  characterSetEffects,
  characterUnion,
  characterUnionArtifacts,
  characterUnionArtifactEffects,
  characterUnionRaiderStats,
  characterCashEquipment,
  characterPetEquipment,
  characterUnionChampion,
  characterUnionChampionBadges,
} from '../../../lib/db/schema.js';

jest.mock('../../../lib/db/index.js', () => ({
  getDb: jest.fn(),
}));

const OCID = 'test-ocid';

/**
 * Builds a mock db where `select().from(table).where(...)` resolves to
 * `rowsByTable.get(table)` (defaulting to []), and the `characters` table
 * additionally supports the `.limit(1)` chain used for the base row lookup.
 */
function buildSelectMockDb(rowsByTable, charRow) {
  return {
    select: jest.fn(() => ({
      from: jest.fn(table => {
        if (table === characters) {
          return {
            where: jest.fn(() => ({
              limit: jest.fn().mockResolvedValue(charRow ? [charRow] : []),
            })),
          };
        }
        return {
          where: jest.fn(() => {
            const rows = rowsByTable.get(table) || [];
            rows.orderBy = jest.fn().mockResolvedValue(rows);
            return rows;
          }),
        };
      }),
    })),
  };
}

const baseCharRow = {
  ocid: OCID,
  characterName: 'TestChar',
  characterLevel: 275,
  characterClass: '聖騎士',
  characterClassLevel: 6,
  worldName: '艾麗亞',
  characterImage: 'https://example.com/img.png',
  characterExpRate: '10.5',
  characterGender: '男',
  characterGuildName: 'TestGuild',
  combatPower: 123456789,
  updatedAt: new Date('2026-07-15T00:00:00.000Z'),
};

describe('queries exports', () => {
  it('should export the new/changed helpers', () => {
    expect(typeof getFullCharacterData).toBe('function');
    expect(typeof upsertEquipmentPreset).toBe('function');
    expect(typeof upsertLinkSkillPreset).toBe('function');
    expect(typeof upsertPetEquipment).toBe('function');
  });
});

describe('replaceEquipmentSnapshot', () => {
  beforeEach(() => jest.clearAllMocks());

  it('replaces active, current, and non-empty preset rows in one transaction while preserving source order', async () => {
    const { getDb } = await import('../../../lib/db/index.js');
    const { replaceEquipmentSnapshot } =
      await import('../../../lib/db/queries.js');
    const insertedValues = [];
    const deletedTables = [];
    const tx = {
      delete: jest.fn(table => {
        deletedTables.push(table);
        return { where: jest.fn().mockResolvedValue(undefined) };
      }),
      insert: jest.fn(() => ({
        values: jest.fn(values => {
          insertedValues.push(values);
          return {
            onDuplicateKeyUpdate: jest.fn().mockResolvedValue(undefined),
          };
        }),
      })),
    };
    const transaction = jest.fn(callback => callback(tx));
    getDb.mockReturnValue({ transaction });

    await replaceEquipmentSnapshot(
      OCID,
      2,
      [
        { item_equipment_slot: 'ring', item_name: 'First Ring' },
        { item_equipment_slot: 'ring', item_name: 'Second Ring' },
      ],
      {
        1: [{ item_equipment_slot: 'hat', item_name: 'Hat' }],
        2: [],
        3: [{ item_equipment_slot: 'weapon', item_name: 'Sword' }],
      }
    );

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(deletedTables).toEqual(
      expect.arrayContaining([
        schema.characterCurrentEquipment,
        characterEquipment,
      ])
    );
    expect(insertedValues).toEqual(
      expect.arrayContaining([
        {
          ocid: OCID,
          activePresetNo: 2,
          hasCurrentEquipmentSnapshot: 1,
        },
        expect.arrayContaining([
          expect.objectContaining({
            itemName: 'First Ring',
            itemEquipmentSlot: 'ring',
            sourceOrdinal: 0,
          }),
          expect.objectContaining({
            itemName: 'Second Ring',
            itemEquipmentSlot: 'ring',
            sourceOrdinal: 1,
          }),
        ]),
        expect.arrayContaining([
          expect.objectContaining({ presetNo: 1, itemName: 'Hat' }),
          expect.objectContaining({ presetNo: 3, itemName: 'Sword' }),
        ]),
      ])
    );
  });

  it('rejects from the transaction when a snapshot insert fails', async () => {
    const { getDb } = await import('../../../lib/db/index.js');
    const { replaceEquipmentSnapshot } =
      await import('../../../lib/db/queries.js');
    const insertFailure = new Error('current equipment insert failed');
    const tx = {
      delete: jest.fn(() => ({
        where: jest.fn().mockResolvedValue(undefined),
      })),
      insert: jest.fn(() => ({
        values: jest.fn(values => {
          if (Array.isArray(values)) return Promise.reject(insertFailure);
          return {
            onDuplicateKeyUpdate: jest.fn().mockResolvedValue(undefined),
          };
        }),
      })),
    };
    const transaction = jest.fn(callback => callback(tx));
    getDb.mockReturnValue({ transaction });

    await expect(
      replaceEquipmentSnapshot(
        OCID,
        1,
        [{ item_equipment_slot: 'hat', item_name: 'Hat' }],
        { 1: [], 2: [], 3: [] }
      )
    ).rejects.toBe(insertFailure);
    expect(transaction).toHaveBeenCalledTimes(1);
  });
});

describe('getFullCharacterData - equipment_presets', () => {
  beforeEach(() => jest.clearAllMocks());

  it('exposes all three presets and treats the active preset as backward-compatible `equipment`', async () => {
    const { getDb } = await import('../../../lib/db/index.js');

    const rows = new Map([
      [
        characterEquipment,
        [
          {
            presetNo: 1,
            itemEquipmentSlot: '帽子',
            itemName: 'Preset1 Hat',
          },
          {
            presetNo: 2,
            itemEquipmentSlot: '帽子',
            itemName: 'Preset2 Hat',
          },
          {
            presetNo: 3,
            itemEquipmentSlot: '帽子',
            itemName: 'Preset3 Hat',
          },
        ],
      ],
      [characterEquipmentPresets, [{ activePresetNo: 2 }]],
    ]);

    getDb.mockReturnValue(buildSelectMockDb(rows, baseCharRow));

    const data = await getFullCharacterData(OCID);

    expect(data.equipment_presets.active).toBe(2);
    expect(data.equipment_presets.presets['1'][0].item_name).toBe(
      'Preset1 Hat'
    );
    expect(data.equipment_presets.presets['2'][0].item_name).toBe(
      'Preset2 Hat'
    );
    expect(data.equipment_presets.presets['3'][0].item_name).toBe(
      'Preset3 Hat'
    );
    // Backward-compat: equipment / preset_no reflect the active preset.
    expect(data.equipment.preset_no).toBe(2);
    expect(data.equipment.item_equipment[0].item_name).toBe('Preset2 Hat');
  });

  it('uses ordered current snapshot rows for legacy equipment while preserving duplicate slots', async () => {
    const { getDb } = await import('../../../lib/db/index.js');

    const rows = new Map([
      [
        schema.characterCurrentEquipment,
        [
          {
            sourceOrdinal: 0,
            itemEquipmentSlot: 'ring',
            itemName: 'First Ring',
          },
          {
            sourceOrdinal: 1,
            itemEquipmentSlot: 'ring',
            itemName: 'Second Ring',
          },
        ],
      ],
      [
        characterEquipment,
        [{ presetNo: 2, itemEquipmentSlot: 'hat', itemName: 'Fallback Hat' }],
      ],
      [characterEquipmentPresets, [{ activePresetNo: 2 }]],
    ]);

    getDb.mockReturnValue(buildSelectMockDb(rows, baseCharRow));

    const data = await getFullCharacterData(OCID);

    expect(data.equipment.item_equipment).toEqual([
      expect.objectContaining({
        item_equipment_slot: 'ring',
        item_name: 'First Ring',
      }),
      expect.objectContaining({
        item_equipment_slot: 'ring',
        item_name: 'Second Ring',
      }),
    ]);
    expect(data.equipment_presets.presets['2'][0].item_name).toBe(
      'Fallback Hat'
    );
  });

  it('keeps a fulfilled empty current snapshot empty when the active preset has gear', async () => {
    const { getDb } = await import('../../../lib/db/index.js');

    const rows = new Map([
      [schema.characterCurrentEquipment, []],
      [
        characterEquipment,
        [{ presetNo: 2, itemEquipmentSlot: 'hat', itemName: 'Preset Hat' }],
      ],
      [
        characterEquipmentPresets,
        [{ activePresetNo: 2, hasCurrentEquipmentSnapshot: true }],
      ],
    ]);

    getDb.mockReturnValue(buildSelectMockDb(rows, baseCharRow));

    const data = await getFullCharacterData(OCID);

    expect(data.equipment.item_equipment).toEqual([]);
  });

  it('falls back to the active preset when no persisted current snapshot exists', async () => {
    const { getDb } = await import('../../../lib/db/index.js');

    const rows = new Map([
      [schema.characterCurrentEquipment, []],
      [
        characterEquipment,
        [{ presetNo: 2, itemEquipmentSlot: 'hat', itemName: 'Fallback Hat' }],
      ],
      [characterEquipmentPresets, [{ activePresetNo: 2 }]],
    ]);

    getDb.mockReturnValue(buildSelectMockDb(rows, baseCharRow));

    const data = await getFullCharacterData(OCID);

    expect(data.equipment.item_equipment).toEqual([
      expect.objectContaining({ item_name: 'Fallback Hat' }),
    ]);
  });

  it('defaults active preset to 1 when no preset row exists in DB (NULL-tolerant)', async () => {
    const { getDb } = await import('../../../lib/db/index.js');

    const rows = new Map([
      [
        characterEquipment,
        [{ presetNo: 1, itemEquipmentSlot: '帽子', itemName: 'Only Hat' }],
      ],
      // no characterEquipmentPresets row at all
    ]);

    getDb.mockReturnValue(buildSelectMockDb(rows, baseCharRow));

    const data = await getFullCharacterData(OCID);

    expect(data.equipment_presets.active).toBe(1);
    expect(data.equipment.preset_no).toBe(1);
    expect(data.equipment.item_equipment[0].item_name).toBe('Only Hat');
  });
});

describe('getFullCharacterData - petEquipment', () => {
  beforeEach(() => jest.clearAllMocks());

  it('maps every pet field the component expects', async () => {
    const { getDb } = await import('../../../lib/db/index.js');

    const rows = new Map([
      [
        characterPetEquipment,
        [
          {
            petEquipmentSlot: 'pet_1',
            petName: 'Pinky Pig',
            petNickname: '小粉',
            petIcon: 'https://example.com/pet1.png',
            petDescription: '可愛的寵物',
            petType: '神奇寵物',
            petTotalOption: { item_name: 'Pet Item', item_option: [] },
            petAutoSkill: { skill_1: '拾取物品', skill_1_icon: 'icon1' },
            petSkill: ['拾取物品', '自動使用道具'],
            petDateExpire: new Date('2099-12-31T00:00:00.000Z'),
            petAppearance: '粉紅豬',
            petAppearanceIcon: 'https://example.com/pet1-appearance.png',
          },
        ],
      ],
    ]);

    getDb.mockReturnValue(buildSelectMockDb(rows, baseCharRow));

    const data = await getFullCharacterData(OCID);

    expect(data.petEquipment.pet_1_name).toBe('Pinky Pig');
    expect(data.petEquipment.pet_1_nickname).toBe('小粉');
    expect(data.petEquipment.pet_1_description).toBe('可愛的寵物');
    expect(data.petEquipment.pet_1_pet_type).toBe('神奇寵物');
    expect(data.petEquipment.pet_1_equipment).toEqual({
      item_name: 'Pet Item',
      item_option: [],
    });
    expect(data.petEquipment.pet_1_auto_skill).toEqual({
      skill_1: '拾取物品',
      skill_1_icon: 'icon1',
    });
    expect(data.petEquipment.pet_1_skill).toEqual(['拾取物品', '自動使用道具']);
    expect(data.petEquipment.pet_1_date_expire).toEqual(
      new Date('2099-12-31T00:00:00.000Z')
    );
    expect(data.petEquipment.pet_1_appearance).toBe('粉紅豬');
    expect(data.petEquipment.pet_1_appearance_icon).toBe(
      'https://example.com/pet1-appearance.png'
    );
  });

  it('tolerates existing rows that predate the new columns (all NULL)', async () => {
    const { getDb } = await import('../../../lib/db/index.js');

    const rows = new Map([
      [
        characterPetEquipment,
        [
          {
            petEquipmentSlot: 'pet_1',
            petName: 'Old Pet',
            petIcon: null,
            petTotalOption: null,
            // nickname/description/type/autoSkill/skill/dateExpire/appearance*
            // are absent entirely, as they would be for pre-migration rows.
          },
        ],
      ],
    ]);

    getDb.mockReturnValue(buildSelectMockDb(rows, baseCharRow));

    const result = await getFullCharacterData(OCID);

    expect(result.petEquipment.pet_1_name).toBe('Old Pet');
    expect(result.petEquipment.pet_1_nickname).toBeUndefined();
    expect(result.petEquipment.pet_1_skill).toEqual([]);
  });
});

describe('getFullCharacterData - linkSkills.character_owned_link_skill', () => {
  beforeEach(() => jest.clearAllMocks());

  it('surfaces the owned link skill when stored', async () => {
    const { getDb } = await import('../../../lib/db/index.js');

    const ownedSkill = {
      skill_name: '聖騎士的信念',
      skill_description: '...',
      skill_level: 3,
      skill_effect: '...',
      skill_icon: 'https://example.com/skill.png',
    };

    const rows = new Map([
      [
        characterLinkSkillPresets,
        [{ usePresetNo: 1, ownedLinkSkill: ownedSkill }],
      ],
    ]);

    getDb.mockReturnValue(buildSelectMockDb(rows, baseCharRow));

    const data = await getFullCharacterData(OCID);

    expect(data.linkSkills.character_owned_link_skill).toEqual(ownedSkill);
  });

  it('returns null (not undefined/throw) when no owned link skill is stored', async () => {
    const { getDb } = await import('../../../lib/db/index.js');

    const rows = new Map([[characterLinkSkillPresets, [{ usePresetNo: 1 }]]]);

    getDb.mockReturnValue(buildSelectMockDb(rows, baseCharRow));

    const data = await getFullCharacterData(OCID);

    expect(data.linkSkills.character_owned_link_skill).toBeNull();
  });
});

describe('upsertEquipmentPreset', () => {
  beforeEach(() => jest.clearAllMocks());

  it('inserts/updates the active preset number', async () => {
    const { getDb } = await import('../../../lib/db/index.js');

    const onDuplicateKeyUpdate = jest.fn().mockResolvedValue(undefined);
    const values = jest.fn(() => ({ onDuplicateKeyUpdate }));
    const insert = jest.fn(() => ({ values }));
    getDb.mockReturnValue({ insert });

    await upsertEquipmentPreset(OCID, 2);

    expect(insert).toHaveBeenCalledWith(characterEquipmentPresets);
    expect(values).toHaveBeenCalledWith({ ocid: OCID, activePresetNo: 2 });
    expect(onDuplicateKeyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        set: expect.objectContaining({ activePresetNo: 2 }),
      })
    );
  });
});

describe('upsertLinkSkillPreset', () => {
  beforeEach(() => jest.clearAllMocks());

  it('stores the owned link skill object when provided', async () => {
    const { getDb } = await import('../../../lib/db/index.js');

    const onDuplicateKeyUpdate = jest.fn().mockResolvedValue(undefined);
    const values = jest.fn(() => ({ onDuplicateKeyUpdate }));
    const insert = jest.fn(() => ({ values }));
    getDb.mockReturnValue({ insert });

    const owned = { skill_name: 'X', skill_level: 1 };
    await upsertLinkSkillPreset(OCID, 1, owned);

    expect(values).toHaveBeenCalledWith({
      ocid: OCID,
      usePresetNo: 1,
      ownedLinkSkill: owned,
    });
  });

  it('defaults ownedLinkSkill to null when omitted', async () => {
    const { getDb } = await import('../../../lib/db/index.js');

    const onDuplicateKeyUpdate = jest.fn().mockResolvedValue(undefined);
    const values = jest.fn(() => ({ onDuplicateKeyUpdate }));
    const insert = jest.fn(() => ({ values }));
    getDb.mockReturnValue({ insert });

    await upsertLinkSkillPreset(OCID, 1);

    expect(values).toHaveBeenCalledWith({
      ocid: OCID,
      usePresetNo: 1,
      ownedLinkSkill: null,
    });
  });
});

describe('upsertPetEquipment', () => {
  beforeEach(() => jest.clearAllMocks());

  it('writes the new pet fields through to the insert', async () => {
    const { getDb } = await import('../../../lib/db/index.js');

    const deleteWhere = jest.fn().mockResolvedValue(undefined);
    const del = jest.fn(() => ({ where: deleteWhere }));
    const values = jest.fn().mockResolvedValue(undefined);
    const insert = jest.fn(() => ({ values }));
    getDb.mockReturnValue({ delete: del, insert });

    await upsertPetEquipment(OCID, [
      {
        pet_name: 'Pinky Pig',
        pet_nickname: '小粉',
        pet_icon: 'icon.png',
        pet_description: 'desc',
        pet_type: '神奇寵物',
        pet_equipment_slot: 'pet_1',
        pet_total_option: { item_name: 'X' },
        pet_auto_skill: { skill_1: 'A' },
        pet_skill: ['A', 'B'],
        pet_date_expire: '2099-12-31T00:00:00.000Z',
        pet_appearance: '粉紅豬',
        pet_appearance_icon: 'appearance.png',
      },
    ]);

    expect(values).toHaveBeenCalledWith([
      expect.objectContaining({
        petName: 'Pinky Pig',
        petNickname: '小粉',
        petDescription: 'desc',
        petType: '神奇寵物',
        petAutoSkill: { skill_1: 'A' },
        petSkill: ['A', 'B'],
        petDateExpire: new Date('2099-12-31T00:00:00.000Z'),
        petAppearance: '粉紅豬',
        petAppearanceIcon: 'appearance.png',
      }),
    ]);
  });

  it('stores null for the Nexon "expired" sentinel instead of an Invalid Date', async () => {
    const { getDb } = await import('../../../lib/db/index.js');

    const deleteWhere = jest.fn().mockResolvedValue(undefined);
    const del = jest.fn(() => ({ where: deleteWhere }));
    const values = jest.fn().mockResolvedValue(undefined);
    const insert = jest.fn(() => ({ values }));
    getDb.mockReturnValue({ delete: del, insert });

    await upsertPetEquipment(OCID, [
      {
        pet_name: 'Pinky Pig',
        pet_equipment_slot: 'pet_1',
        pet_date_expire: 'expired',
      },
    ]);

    expect(values).toHaveBeenCalledWith([
      expect.objectContaining({ petDateExpire: null }),
    ]);
  });
});
