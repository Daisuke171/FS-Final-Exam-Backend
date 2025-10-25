import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';


type EventType = 'chatMessage' | 'chatMessageUpdated' | 'notification' | 'call';    

export interface EventPayload<T = any> {
  type: EventType;
  data: T;
}

@Injectable()
export class ObservableService {
  private subject = new Subject<EventPayload>();
  public readonly events$: Observable<EventPayload> = this.subject.asObservable();

  notify(evt: EventPayload) {
    this.subject.next(evt);
  }
}
