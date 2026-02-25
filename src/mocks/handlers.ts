import { http, HttpResponse } from 'msw';

const API_BASE_URL = 'https://backresultados.tuvotodecide.com/api/v1';

export const handlers = [
    // Handler para Login Mock (Intercepta las credenciales de prueba)
    http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
        const body = (await request.json()) as any;

        if (body.password === 'test1234') {
            if (body.email === 'alcalde@test.com') {
                const user = {
                    id: 'mock-alcalde-lp',
                    name: 'ALCALDE LA PAZ',
                    email: 'alcalde@test.com',
                    role: 'MAYOR',
                    status: 'ACTIVE',
                    active: true,
                    departmentId: '6740f90766c62c3e1e2474f8',
                    municipalityId: '674100be66c62c3e1e247b97',
                };
                return HttpResponse.json({
                    accessToken: 'mock-access-token-alcalde',
                    role: 'MAYOR',
                    active: true,
                    user,
                });
            }

            if (body.email === 'gobernador@test.com') {
                const user = {
                    id: 'mock-gober-lp',
                    name: 'GOBERNADOR LA PAZ',
                    email: 'gobernador@test.com',
                    role: 'GOVERNOR',
                    status: 'ACTIVE',
                    active: true,
                    departmentId: '6740f90766c62c3e1e2474f8',
                };
                return HttpResponse.json({
                    accessToken: 'mock-access-token-gober',
                    role: 'GOVERNOR',
                    active: true,
                    user,
                });
            }
        }

        // Si no son credenciales de prueba, devolvemos una señal para que MSW no haga nada
        // y la petición siga su curso real a la red
        return undefined;
    }),

    // Mock para Participación Personal (que antes estaba en queryFn)
    http.get(`${API_BASE_URL}/personal/participacion`, () => {
        return HttpResponse.json({
            summary: { contratados: 83, participaron: 73, faltantes: 10 },
            details: [
                { _id: "1", recinto: "Col. Simón Bolivar", mesa: "1024", usuario: "Juan Pérez", estado: "Recibida", ballotId: "b1" },
                { _id: "2", recinto: "Col. Simón Bolivar", mesa: "1025", usuario: "---", estado: "Faltante", ballotId: null },
                { _id: "3", recinto: "Col. Simón Bolivar", mesa: "1026", usuario: "Maria López", estado: "Recibida", ballotId: "b2" },
            ],
        });
    }),
];
