import { render, screen, fireEvent } from '@testing-library/react';
import EquipmentCompareTab from '../../../components/compare/EquipmentCompareTab';

const dummyRow = {
  category: 'Equipment',
  metric: 'currentEquipmentStarSum',
  left: 17,
  right: 17,
  delta: 0,
  unit: null,
  direction: 'even',
  evidence: 'derived',
  coverage: 'complete',
};

function buildEquipmentData(item) {
  return {
    preset_no: 1,
    item_equipment: item ? [item] : [],
    item_equipment_preset_1: [],
    item_equipment_preset_2: [],
    item_equipment_preset_3: [],
  };
}

describe('EquipmentCompareTab', () => {
  it('shows the actual star force number for an item that has one', () => {
    const leftEquipmentData = buildEquipmentData({
      item_equipment_slot: '帽子',
      item_name: '測試帽子（我方）',
      starforce: 17,
    });
    const rightEquipmentData = buildEquipmentData({
      item_equipment_slot: '帽子',
      item_name: '測試帽子（參考）',
      starforce: 22,
    });

    render(
      <EquipmentCompareTab
        leftEquipmentData={leftEquipmentData}
        rightEquipmentData={rightEquipmentData}
        starSumRow={dummyRow}
        starForceRow={dummyRow}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /展開帽子詳細資訊/ }));
    expect(screen.getByText('星力 17')).toBeInTheDocument();
    expect(screen.getByText('星力 22')).toBeInTheDocument();
  });

  it('shows 未知 (never 0) for an item whose starforce field is genuinely absent', () => {
    const leftEquipmentData = buildEquipmentData({
      item_equipment_slot: '帽子',
      item_name: '測試帽子（我方）',
      starforce: 17,
    });
    // No `starforce` field at all on the reference item — structurally
    // absent, not a real zero.
    const rightEquipmentData = buildEquipmentData({
      item_equipment_slot: '帽子',
      item_name: '測試帽子（參考，無星力欄位）',
    });

    render(
      <EquipmentCompareTab
        leftEquipmentData={leftEquipmentData}
        rightEquipmentData={rightEquipmentData}
        starSumRow={dummyRow}
        starForceRow={dummyRow}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /展開帽子詳細資訊/ }));
    expect(screen.getByText('星力 17')).toBeInTheDocument();
    expect(screen.getByText('星力 未知')).toBeInTheDocument();
    expect(screen.queryByText('星力 0')).not.toBeInTheDocument();
  });

  it('renders breakdown rows only for sources where a side has a value', () => {
    const attackRow = {
      ...dummyRow,
      left: 746,
      right: 682,
      delta: 64,
      direction: 'ahead',
    };
    const magicRow = { ...dummyRow, left: 0, right: 0, delta: 0 };

    render(
      <EquipmentCompareTab
        leftEquipmentData={buildEquipmentData(null)}
        rightEquipmentData={buildEquipmentData(null)}
        starSumRow={dummyRow}
        starForceRow={dummyRow}
        sourceRows={[
          { label: '卷軸攻擊力', row: attackRow },
          { label: '卷軸魔力', row: magicRow },
        ]}
      />
    );

    expect(screen.getByText('攻擊力來源拆解')).toBeInTheDocument();
    expect(screen.getByText('卷軸攻擊力')).toBeInTheDocument();
    expect(screen.getByText('746')).toBeInTheDocument();
    expect(screen.getByText('682')).toBeInTheDocument();
    expect(screen.getByText('+64')).toBeInTheDocument();
    expect(screen.queryByText('卷軸魔力')).not.toBeInTheDocument();
  });

  it('hides the breakdown table entirely when no source has a value', () => {
    render(
      <EquipmentCompareTab
        leftEquipmentData={buildEquipmentData(null)}
        rightEquipmentData={buildEquipmentData(null)}
        starSumRow={dummyRow}
        starForceRow={dummyRow}
        sourceRows={[
          { label: '卷軸攻擊力', row: { ...dummyRow, left: 0, right: 0 } },
        ]}
      />
    );

    expect(screen.queryByText('攻擊力來源拆解')).not.toBeInTheDocument();
  });

  it('summarizes the per-slot stat difference when both sides are equipped', () => {
    const leftEquipmentData = buildEquipmentData({
      item_equipment_slot: '帽子',
      item_name: '測試帽子（我方）',
      starforce: 17,
      item_total_option: { luk: '300', attack_power: '120' },
      item_etc_option: { attack_power: '121' },
    });
    const rightEquipmentData = buildEquipmentData({
      item_equipment_slot: '帽子',
      item_name: '測試帽子（參考）',
      starforce: 22,
      item_total_option: { luk: '250', attack_power: '150' },
    });

    render(
      <EquipmentCompareTab
        leftEquipmentData={leftEquipmentData}
        rightEquipmentData={rightEquipmentData}
        starSumRow={dummyRow}
        starForceRow={dummyRow}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /展開帽子詳細資訊/ }));
    expect(screen.getByText(/差異（我方 − 參考）/)).toBeInTheDocument();
    expect(screen.getByText('星力 -5')).toBeInTheDocument();
    expect(screen.getByText('LUK +50')).toBeInTheDocument();
    expect(screen.getByText('攻擊力 -30')).toBeInTheDocument();
    // Concrete scroll value replaces the vague scroll/flame note.
    expect(screen.getByText('卷軸 攻+121')).toBeInTheDocument();
  });

  it('omits the difference line when one side is not equipped', () => {
    const leftEquipmentData = buildEquipmentData({
      item_equipment_slot: '帽子',
      item_name: '測試帽子（我方）',
      starforce: 17,
      item_total_option: { luk: '300' },
    });

    render(
      <EquipmentCompareTab
        leftEquipmentData={leftEquipmentData}
        rightEquipmentData={buildEquipmentData(null)}
        starSumRow={dummyRow}
        starForceRow={dummyRow}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /展開帽子詳細資訊/ }));
    expect(screen.queryByText(/差異（我方 − 參考）/)).not.toBeInTheDocument();
  });

  it('shows an actual 0 star force as 0, not as unknown', () => {
    const leftEquipmentData = buildEquipmentData({
      item_equipment_slot: '帽子',
      item_name: '真的沒打星的帽子',
      starforce: 0,
    });
    const rightEquipmentData = buildEquipmentData({
      item_equipment_slot: '帽子',
      item_name: '測試帽子（參考）',
      starforce: 22,
    });

    render(
      <EquipmentCompareTab
        leftEquipmentData={leftEquipmentData}
        rightEquipmentData={rightEquipmentData}
        starSumRow={dummyRow}
        starForceRow={dummyRow}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /展開帽子詳細資訊/ }));
    expect(screen.getByText('星力 0')).toBeInTheDocument();
  });
});
