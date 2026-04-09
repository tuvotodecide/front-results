/**
 * Funciones auxiliares para tests de Cypress
 * Helpers reutilizables que no son comandos de Cypress
 */

/**
 * Genera un email único para tests
 */
export const generateUniqueEmail = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `test_${timestamp}_${random}@example.com`;
};

/**
 * Genera datos de usuario de prueba
 */
export const generateTestUser = () => {
  return {
    name: `Usuario Test ${Date.now()}`,
    email: generateUniqueEmail(),
    password: 'Test123456!',
  };
};

/**
 * Valida formato de email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Formatea número con separadores de miles
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('es-BO');
};

/**
 * Calcula porcentaje con 2 decimales
 */
export const calculatePercentage = (part: number, total: number): string => {
  if (total === 0) return '0.00';
  return ((part / total) * 100).toFixed(2);
};

/**
 * Valida que un porcentaje esté en formato correcto
 */
export const isValidPercentageFormat = (text: string): boolean => {
  // Debe tener formato XX.XX% o X.XX%
  const percentageRegex = /^\d+\.\d{2}%$/;
  return percentageRegex.test(text);
};

/**
 * Extrae todos los porcentajes de un texto
 */
export const extractPercentages = (text: string): number[] => {
  const regex = /(\d+\.\d+)%/g;
  const matches = text.matchAll(regex);
  return Array.from(matches).map(match => parseFloat(match[1]));
};

/**
 * Verifica que la suma de porcentajes no exceda 100%
 */
export const validatePercentageSum = (percentages: number[]): boolean => {
  const sum = percentages.reduce((acc, val) => acc + val, 0);
  return sum <= 100.01; // Permitir pequeño margen de error por redondeo
};

/**
 * Genera código de mesa aleatorio
 */
export const generateTableCode = (department = 'LP'): string => {
  const zone = Math.floor(Math.random() * 999) + 1;
  const number = Math.floor(Math.random() * 99999) + 1;
  return `${department}-${zone.toString().padStart(3, '0')}-${number.toString().padStart(5, '0')}`;
};

/**
 * Valida estructura de código de mesa
 */
export const isValidTableCode = (code: string): boolean => {
  // Formato: XX-XXX-XXXXX
  const tableCodeRegex = /^[A-Z]{2}-\d{3}-\d{5}$/;
  return tableCodeRegex.test(code);
};

/**
 * Limpia espacios de un string (trim + espacios internos múltiples)
 */
export const cleanString = (str: string): string => {
  return str.trim().replace(/\s+/g, ' ');
};

/**
 * Espera condicional basada en el DOM
 */
export const waitUntil = (
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, interval);
      }
    };
    
    check();
  });
};

/**
 * Genera datos de resultados mock
 */
export const generateMockResults = (partiesCount: number = 5) => {
  const parties = ['MAS', 'CC', 'CREEMOS', 'UCS', 'OTROS'];
  const results = [];
  
  let totalVotes = 0;
  for (let i = 0; i < partiesCount && i < parties.length; i++) {
    const votes = Math.floor(Math.random() * 100000) + 1000;
    totalVotes += votes;
    results.push({
      partyId: parties[i],
      totalVotes: votes,
    });
  }
  
  return {
    results,
    summary: {
      validVotes: totalVotes,
      nullVotes: Math.floor(totalVotes * 0.05),
      blankVotes: Math.floor(totalVotes * 0.03),
      tablesProcessed: Math.floor(Math.random() * 1000),
      totalTables: 5000,
    }
  };
};

/**
 * Genera datos de mesa mock
 */
export const generateMockTable = () => {
  const departments = ['La Paz', 'Cochabamba', 'Santa Cruz', 'Oruro', 'Potosí'];
  const department = departments[Math.floor(Math.random() * departments.length)];
  
  return {
    _id: `table_${Date.now()}`,
    tableNumber: Math.floor(Math.random() * 99999).toString(),
    tableCode: generateTableCode(),
    department: { _id: 'dept1', name: department },
    province: { _id: 'prov1', name: 'Provincia Test' },
    municipality: { _id: 'mun1', name: 'Municipio Test' },
    electoralLocation: {
      _id: 'loc1',
      name: 'Recinto Test',
      address: 'Calle Test 123'
    }
  };
};

/**
 * Valida que no haya valores undefined/null/NaN en el DOM
 */
export const validateNoInvalidValues = (text: string): boolean => {
  const invalidValues = ['undefined', 'null', 'NaN', 'Infinity'];
  return !invalidValues.some(invalid => text.includes(invalid));
};

/**
 * Extrae números de un texto
 */
export const extractNumbers = (text: string): number[] => {
  const regex = /\d+/g;
  const matches = text.match(regex);
  return matches ? matches.map(Number) : [];
};

/**
 * Genera timestamp en formato legible
 */
export const getReadableTimestamp = (): string => {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
};

/**
 * Retry function con backoff exponencial
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError!;
};

/**
 * Detecta si estamos en modo mock/e2e/hybrid
 */
export const getTestMode = (): 'mock' | 'e2e' | 'hybrid' => {
  return (Cypress.env('testMode') || 'hybrid') as 'mock' | 'e2e' | 'hybrid';
};

/**
 * Verifica si un test debe usar mocks
 */
export const shouldUseMocks = (): boolean => {
  const mode = getTestMode();
  return mode === 'mock' || mode === 'hybrid';
};

/**
 * Log personalizado para debugging
 */
export const debugLog = (message: string, data?: any) => {
  if (Cypress.env('DEBUG') === true) {
    cy.log(`[DEBUG] ${message}`);
    if (data) {
      Cypress.log({
        name: 'debug:data',
        message: JSON.stringify(data),
      });
    }
  }
};

/**
 * Genera fixture path dinámico
 */
export const getFixturePath = (fixtureName: string): string => {
  return `${fixtureName}.json`;
};

/**
 * Convierte objeto a query string
 */
export const objectToQueryString = (obj: Record<string, any>): string => {
  const params = new URLSearchParams();
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  return params.toString();
};

/**
 * Parsea query string a objeto
 */
export const queryStringToObject = (queryString: string): Record<string, string> => {
  const params = new URLSearchParams(queryString);
  const obj: Record<string, string> = {};
  params.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
};

/**
 * Espera a que un elemento desaparezca
 */
export const waitForElementToDisappear = (
  selector: string,
  timeout: number = 10000
) => {
  cy.get('body', { timeout }).should(($body) => {
    expect($body.find(selector).length).to.equal(0);
  });
};

/**
 * Valida estructura de respuesta de API
 */
export const validateApiResponse = (response: any, requiredFields: string[]): boolean => {
  return requiredFields.every(field => {
    return response.hasOwnProperty(field);
  });
};

/**
 * Genera color hexadecimal aleatorio
 */
export const generateRandomColor = (): string => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
};

/**
 * Convierte IPFS URI a URL HTTP
 */
export const ipfsToHttp = (ipfsUri: string, gateway: string = 'https://ipfs.io'): string => {
  if (!ipfsUri) return '';
  const hash = ipfsUri.replace('ipfs://', '');
  return `${gateway}/ipfs/${hash}`;
};

/**
 * Valida que un elemento esté en viewport
 */
export const isInViewport = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
};

/**
 * Genera datos de ballot mock
 */
export const generateMockBallot = () => {
  return {
    _id: `ballot_${Date.now()}`,
    tableCode: generateTableCode(),
    tableNumber: Math.floor(Math.random() * 99999).toString(),
    image: 'ipfs://QmTest' + Math.random().toString(36).substring(7),
    recordId: 'nft-' + Math.random().toString(36).substring(7),
    ipfsUri: 'https://ipfs.io/ipfs/QmTest/metadata.json',
    location: {
      department: 'La Paz',
      province: 'Murillo',
      municipality: 'La Paz'
    },
    votes: {
      parties: {
        validVotes: 450,
        nullVotes: 20,
        blankVotes: 10,
        partyVotes: [
          { partyId: 'MAS', votes: 200 },
          { partyId: 'CC', votes: 150 },
          { partyId: 'CREEMOS', votes: 100 }
        ]
      }
    }
  };
};

export default {
  generateUniqueEmail,
  generateTestUser,
  isValidEmail,
  formatNumber,
  calculatePercentage,
  isValidPercentageFormat,
  extractPercentages,
  validatePercentageSum,
  generateTableCode,
  isValidTableCode,
  cleanString,
  waitUntil,
  generateMockResults,
  generateMockTable,
  validateNoInvalidValues,
  extractNumbers,
  getReadableTimestamp,
  retryWithBackoff,
  getTestMode,
  shouldUseMocks,
  debugLog,
  getFixturePath,
  objectToQueryString,
  queryStringToObject,
  waitForElementToDisappear,
  validateApiResponse,
  generateRandomColor,
  ipfsToHttp,
  isInViewport,
  generateMockBallot,
};
