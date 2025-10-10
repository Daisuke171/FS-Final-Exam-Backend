import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';


type EventType = 'chatMessage' | 'notification' | 'call';    

export interface EventPayload {
  type: EventType;
  data: any;
}

@Injectable()
export class ObservableService {
    // Subject de RxJS para manejar eventos
  private eventSubject = new Subject<EventPayload>();

  // Observable al que se pueden suscribir
  // El sufijo $ indica que la variable es un Observable o un flujo de datos reactivo.
  events$ = this.eventSubject.asObservable();

  // Método para emitir un evento
  notify(payload: EventPayload) {
    this.eventSubject.next(payload);
  }
}
