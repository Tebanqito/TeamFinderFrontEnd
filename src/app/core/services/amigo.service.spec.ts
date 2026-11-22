import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { Amigo } from '../models/amigo.model';
import { amigoDePrueba } from '../testing/datos-prueba';
import { AmigoService } from './amigo.service';

describe('AmigoService', () => {
  it('listar pide GET /amigos', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);
    let recibidos: Amigo[] = [];

    TestBed.inject(AmigoService).listar().subscribe((a) => (recibidos = a));

    const req = http.expectOne(`${environment.apiUrl}/amigos`);
    expect(req.request.method).toBe('GET');
    req.flush([amigoDePrueba(), amigoDePrueba({ id: 10, nombre: 'ana', equipoId: 2 })]);
    http.verify();

    expect(recibidos.map((a) => a.nombre)).toEqual(['lucas', 'ana']);
  });
});
