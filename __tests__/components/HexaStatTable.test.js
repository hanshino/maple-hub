import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import HexaStatTable from '../../components/HexaStatTable.js';

describe('HexaStatTable', () => {
  const mockStatCores = [
    {
      slot_id: '0',
      main_stat_name: 'boss傷害增加',
      sub_stat_name_1: '爆擊傷害增加',
      sub_stat_name_2: '主要屬性增加',
      main_stat_level: 3,
      sub_stat_level_1: 7,
      sub_stat_level_2: 10,
      stat_grade: 20,
    },
    {
      slot_id: '1',
      main_stat_name: '最終傷害增加',
      sub_stat_name_1: '無視防禦力',
      sub_stat_name_2: null,
      main_stat_level: 5,
      sub_stat_level_1: 10,
      sub_stat_level_2: 0,
      stat_grade: 15,
    },
    {
      slot_id: '2',
      main_stat_name: null,
      sub_stat_name_1: null,
      sub_stat_name_2: null,
      main_stat_level: 0,
      sub_stat_level_1: 0,
      sub_stat_level_2: 0,
      stat_grade: 0,
    },
  ];

  test('renders table with activated stat cores', () => {
    render(<HexaStatTable cores={mockStatCores} />);

    expect(screen.getByText('六轉屬性核心')).toBeInTheDocument();

    // Check headers
    expect(screen.getByText('主要屬性')).toBeInTheDocument();
    expect(screen.getByText('副屬性1')).toBeInTheDocument();
    expect(screen.getByText('副屬性2')).toBeInTheDocument();
    expect(screen.getByText('等級')).toBeInTheDocument();

    // Check activated core data
    expect(screen.getByText('boss傷害增加 (Lv 3)')).toBeInTheDocument();
    expect(screen.getByText('爆擊傷害增加 (Lv 7)')).toBeInTheDocument();
    expect(screen.getByText('最終傷害增加 (Lv 5)')).toBeInTheDocument();
    expect(screen.getByText('無視防禦力 (Lv 10)')).toBeInTheDocument();

    // Check grades
    expect(screen.getByText('20/20')).toBeInTheDocument();
    expect(screen.getByText('15/20')).toBeInTheDocument();
    expect(screen.getByText('0/20')).toBeInTheDocument();
  });

  test('renders unactivated core correctly', () => {
    render(<HexaStatTable cores={mockStatCores} />);

    expect(screen.getByText('未啟用')).toBeInTheDocument();
    // Core 1 has null sub_stat_name_2, Core 2 has null sub_stat_name_1 and sub_stat_name_2
    expect(screen.getAllByText('-')).toHaveLength(3);
  });

  test('renders empty state when no cores provided', () => {
    render(<HexaStatTable cores={[]} />);

    expect(screen.getByText('六轉屬性核心')).toBeInTheDocument();
    expect(screen.getByText('尚未啟用任何屬性核心')).toBeInTheDocument();
  });

  test('renders empty state when cores is null', () => {
    render(<HexaStatTable cores={null} />);

    expect(screen.getByText('六轉屬性核心')).toBeInTheDocument();
    expect(screen.getByText('尚未啟用任何屬性核心')).toBeInTheDocument();
  });

  test('renders empty state when cores is undefined', () => {
    render(<HexaStatTable />);

    expect(screen.getByText('六轉屬性核心')).toBeInTheDocument();
    expect(screen.getByText('尚未啟用任何屬性核心')).toBeInTheDocument();
  });

  test('applies correct styling for different grade levels', () => {
    render(<HexaStatTable cores={mockStatCores} />);

    // Check that grades are displayed (styling would be tested with visual regression)
    const gradeElements = screen.getAllByText(/\/20/);
    expect(gradeElements).toHaveLength(3);
  });

  test('handles cores with missing sub stat 2', () => {
    const coresWithMissingSub2 = [
      {
        slot_id: '0',
        main_stat_name: 'boss傷害增加',
        sub_stat_name_1: '爆擊傷害增加',
        sub_stat_name_2: null,
        main_stat_level: 3,
        sub_stat_level_1: 7,
        sub_stat_level_2: 0,
        stat_grade: 10,
      },
    ];

    render(<HexaStatTable cores={coresWithMissingSub2} />);

    expect(screen.getByText('boss傷害增加 (Lv 3)')).toBeInTheDocument();
    expect(screen.getByText('爆擊傷害增加 (Lv 7)')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument(); // Missing sub stat 2
  });
});
