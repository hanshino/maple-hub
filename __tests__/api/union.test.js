import axios from 'axios';
import { GET } from '../../app/api/union/[ocid]/route';

describe('/api/union/[ocid]', () => {
  it('should return union data for valid ocid', async () => {
    // Mock axios
    const mockResponse = {
      data: {
        date: null,
        union_level: 9706,
        union_grade: '宗師戰地聯盟 4',
        union_artifact_level: 52,
        union_artifact_exp: 15340,
        union_artifact_point: 17600,
      },
    };
    axios.get = jest.fn().mockResolvedValue(mockResponse);

    const request = {}; // Mock request
    const params = { ocid: 'test-ocid' };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockResponse.data);
  });

  it('should handle API errors', async () => {
    axios.get = jest.fn().mockRejectedValue(new Error('API Error'));

    const request = {}; // Mock request
    const params = { ocid: 'test-ocid' };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch union data');
  });
});
