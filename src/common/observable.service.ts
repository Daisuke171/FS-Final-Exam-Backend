import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';


type EventType = 'chatMessage' | 'notification' | 'call';    

export interface EventPayload {
  type: EventType;
  data: any;
}

@Injectable()
export class ObservableService {
    // Subject de RxJS para manejar eventos
  private eventSubject: Subject<EventPayload> = new Subject();

  // Observable al que se pueden suscribir
  // El sufijo $ indica que la variable es un Observable o un flujo de datos reactivo.
  readonly events$ : Observable<EventPayload> = this.eventSubject.asObservable();

  // Método para emitir un evento
  notify(payload: EventPayload): void {
    this.eventSubject.next(payload);
  }
}
