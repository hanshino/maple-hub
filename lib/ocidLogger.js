class OcidLogger {
  constructor() {
    this.ocids = new Set(); // Simple set of OCIDs to sync
  }

  async logOcid(ocid, googleSheetsClient) {
    // Check if OCID already exists in Google Sheets
    const exists = await googleSheetsClient.ocidExists(ocid);
    if (!exists && !this.ocids.has(ocid)) {
      this.ocids.add(ocid);
    }
  }

  getAllOcids() {
    return Array.from(this.ocids);
  }

  clear() {
    this.ocids.clear();
  }
}

export default OcidLogger;
