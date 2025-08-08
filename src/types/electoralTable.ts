// Full interface for electoral table data from the server with populated electoralLocationId (used by getElectoralTables)
export interface ElectoralTablesType {
  _id: string;
  tableNumber: string;
  tableCode: string;
  electoralLocationId: {
    _id: string;
    address: string;
    code: string;
    name: string;
    electoralSeatId: {
      _id: string;
      name: string;
      municipalityId: {
        _id: string;
        name: string;
        provinceId: {
          _id: string;
          name: string;
          departmentId: {
            _id: string;
            name: string;
          };
        };
      };
    };
  };
  active: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// Interface for electoral table data with unpopulated electoralLocationId (used by getElectoralTablesByElectoralLocationId)
export interface ElectoralTableType {
  _id: string;
  tableNumber: string;
  tableCode: string;
  electoralLocationId: string; // Just the ID, not populated
  active: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// Interface for electoral table data with partially populated electoralLocationId (used by getElectoralTableByTableCode)
export interface ElectoralTableByCodeType {
  _id: string;
  tableNumber: string;
  tableCode: string;
  electoralLocationId: {
    _id: string;
    address: string;
    code: string;
    name: string;
  };
  active: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface ElectoralTableTransformedType {
  _id: string;
  tableNumber: string;
  tableCode: string;
  department: {
    _id: string;
    name: string;
  };
  province: {
    _id: string;
    name: string;
  };
  municipality: {
    _id: string;
    name: string;
  };
  electoralLocation: {
    _id: string;
    address: string;
    code: string;
    name: string;
  };
  electoralSeat: {
    _id: string;
    name: string;
  };
  active: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// Base interface for creating an electoral table (without server-generated fields)
export interface CreateElectoralTableType {
  tableNumber: string;
  tableCode: string;
  electoralLocationId: string;
  active?: boolean;
}

// Interface for updating an electoral table (partial fields, excluding server-generated ones)
export interface UpdateElectoralTableType {
  tableNumber?: string;
  tableCode?: string;
  electoralLocationId?: string;
  active?: boolean;
}
