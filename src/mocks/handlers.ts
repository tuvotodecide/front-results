import { http, HttpResponse } from 'msw';

export const handlers = [
    // Handler para Registro (Intercepta registros de prueba)
    http.post('*/auth/register', async ({ request }) => {
        const body = (await request.json()) as any;
        if (body.email === 'alcalde@test.com' || body.email === 'admin@test.com' || body.email === 'alcalde.lapaz@test.local') {
            return HttpResponse.json(
                { message: 'Usuario ya registrado' },
                { status: 400 }
            );
        }
        return HttpResponse.json({
            message: 'Registro exitoso',
            status: 'VERIFY_EMAIL',
            email: body.email
        }, { status: 201 });
    }),

    // Handler para Login Mock (Intercepta las credenciales de prueba)
    http.post('*/auth/login', async ({ request }) => {
        const body = (await request.json()) as any;

        // Solo interceptamos si la contraseña es la de prueba
        if (body.password === 'test1234') {
            if (body.email === 'admin@test.com' || body.email === 'admin@local.test') {
                const user = {
                    id: 'mock-admin-id',
                    name: 'ADMINISTRADOR CENTRAL',
                    email: 'admin@test.com',
                    role: 'SUPERADMIN',
                    status: 'ACTIVE',
                    active: true,
                };
                return HttpResponse.json({
                    accessToken: 'mock-access-token-admin',
                    role: 'SUPERADMIN',
                    active: true,
                    user,
                });
            }

            if (body.email === 'alcalde@test.com' || body.email === 'alcalde.lapaz@test.local') {
                const user = {
                    id: 'mock-alcalde-lp',
                    name: 'ALCALDE LA PAZ',
                    email: 'alcalde@test.com',
                    role: 'MAYOR',
                    status: 'ACTIVE',
                    active: true,
                    departmentId: 'dept-lp',
                    departmentName: 'La Paz',
                    municipalityId: 'mun-lp',
                    municipalityName: 'Nuestra Señora de La Paz',
                };
                return HttpResponse.json({
                    accessToken: 'mock-access-token-alcalde',
                    role: 'MAYOR',
                    active: true,
                    user,
                });
            }

            if (body.email === 'gobernador@test.com' || body.email === 'gobernador.lapaz@test.local') {
                const user = {
                    id: 'mock-gober-lp',
                    name: 'GOBERNADOR LA PAZ',
                    email: 'gobernador@test.com',
                    role: 'GOVERNOR',
                    status: 'ACTIVE',
                    active: true,
                    departmentId: 'dept-lp',
                    departmentName: 'La Paz',
                };
                return HttpResponse.json({
                    accessToken: 'mock-access-token-gober',
                    role: 'GOVERNOR',
                    active: true,
                    user,
                });
            }

            if (body.email === 'pendiente@test.com') {
                return new HttpResponse(
                    JSON.stringify({ message: 'Usuario pendiente de aprobación' }),
                    { status: 401, headers: { 'Content-Type': 'application/json' } }
                );
            }

            if (body.email === 'noverificado@test.com') {
                return new HttpResponse(
                    JSON.stringify({ message: 'El correo no ha sido verificado' }),
                    { status: 401, headers: { 'Content-Type': 'application/json' } }
                );
            }

            if (body.email === 'rechazado@test.com') {
                return new HttpResponse(
                    JSON.stringify({ message: 'Acceso denegado' }),
                    { status: 403, headers: { 'Content-Type': 'application/json' } }
                );
            }
        }

        // Si no coincide con los mocks de prueba, MSW deja que la petición vaya a la API REAL
        return undefined;
    }),

    // Mock para Perfil (Evita el 401 al usar tokens de prueba)
    http.get('*/auth/profile', ({ request }) => {
        const auth = request.headers.get('Authorization');
        if (auth?.includes('mock-access-token-admin')) {
            return HttpResponse.json({
                data: {
                    id: 'mock-admin-id',
                    name: 'ADMINISTRADOR CENTRAL',
                    email: 'admin@test.com',
                    role: 'SUPERADMIN',
                    status: 'ACTIVE',
                }
            });
        }
        if (auth?.includes('mock-access-token-alcalde')) {
            return HttpResponse.json({
                data: {
                    id: 'mock-alcalde-lp',
                    name: 'ALCALDE LA PAZ',
                    email: 'alcalde@test.com',
                    role: 'MAYOR',
                    status: 'ACTIVE',
                    votingDepartmentId: '6740f90766c62c3e1e2474f8',
                    votingMunicipalityId: '674100be66c62c3e1e247b97',
                }
            });
        }
        return undefined; // Deja pasar a la API real
    }),

    // Mock para Partidos Políticos
    http.get('*/political-parties', ({ request }) => {
        const auth = request.headers.get('Authorization');
        if (auth?.includes('mock-access-token')) {
            return HttpResponse.json([
                { _id: '1', partyId: 'azul', fullName: 'Partido Azul', shortName: 'PA', color: '#0000FF', active: true },
                { _id: '2', partyId: 'rojo', fullName: 'Frente Rojo', shortName: 'FR', color: '#FF0000', active: true },
            ]);
        }
        return undefined;
    }),

    // Mock para Configuración de Elecciones
    http.get('*/elections/config/status', ({ request }) => {
        const auth = request.headers.get('Authorization');
        if (auth?.includes('mock-access-token')) {
            return HttpResponse.json({
                elections: [
                    { id: 'eleccion-2025', name: 'Elecciones Generales', type: 'presidential', isActive: true, isVotingPeriod: true }
                ]
            });
        }
        return undefined;
    }),

    http.get('*/elections/config', () => {
        return HttpResponse.json([
            {
                id: 'eleccion-2025',
                name: 'Elecciones Generales',
                isActive: true
            }
        ]);
    }),

    // Mock Geográfico
    http.get('*/geographic/departments', () => {
        return HttpResponse.json({
            data: [
                { _id: 'dept-lp', name: 'La Paz' },
                { _id: 'dept-cbba', name: 'Cochabamba' },
                { _id: 'dept-scz', name: 'Santa Cruz' }
            ],
            pagination: { page: 1, limit: 10, total: 3, pages: 1 }
        });
    }),

    http.get('*/geographic/provinces/by-department/*', () => {
        return HttpResponse.json([
            { _id: 'prov-murillo', name: 'Murillo', departmentId: 'dept-lp' }
        ]);
    }),

    http.get('*/geographic/municipalities/by-province/*', () => {
        return HttpResponse.json([
            { _id: 'mun-lp', name: 'Nuestra Señora de La Paz', provinceId: 'prov-murillo' }
        ]);
    }),

    http.get('*/geographic/electoral-seats/by-municipality/*', () => {
        return HttpResponse.json([
            { _id: 'seat-lp', name: 'Nuestra Señora de La Paz', municipalityId: 'mun-lp' }
        ]);
    }),

    http.get('*/geographic/electoral-locations/by-electoral-seat/*', () => {
        return HttpResponse.json([
            { _id: 'loc-lp', name: 'Escuela Bolivia', electoralSeatId: 'seat-lp' }
        ]);
    }),

    // Mock para Participación Personal
    http.get('*/personal/participacion', () => {
        return HttpResponse.json({
            summary: { contratados: 83, participaron: 73, faltantes: 10 },
            details: [
                { _id: "1", recinto: "Col. Simón Bolivar", mesa: "1024", usuario: "Juan Pérez", estado: "Recibida", ballotId: "b1" },
                { _id: "2", recinto: "Col. Simón Bolivar", mesa: "1025", usuario: "---", estado: "Faltante", ballotId: null },
                { _id: "3", recinto: "Col. Simón Bolivar", mesa: "1026", usuario: "Maria López", estado: "Recibida", ballotId: "b2" },
            ],
        });
    }),

    // Mock genérico para resultados (para evitar 404s en filtros)
    http.get('*/results/*', () => {
        return HttpResponse.json({
            results: [],
            summary: {
                totalTables: 100,
                tablesProcessed: 10,
                validVotes: 1000,
                nullVotes: 50,
                blankVotes: 20
            }
        });
    }),
];

