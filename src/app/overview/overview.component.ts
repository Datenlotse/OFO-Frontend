import { Component, OnInit, InjectionToken, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';

import { MatSnackBar } from '@angular/material/snack-bar';
import { CookieService } from 'ngx-cookie-service';

export const WINDOW = new InjectionToken('window',
    { providedIn: 'root', factory: () => window }
);

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent implements OnInit {

  private _activeRouteSUB: Subscription;

  private eventId: string;

  slide = 1;

  idError = false;

  event;

  constructor(private _activeRoute: ActivatedRoute,
             @Inject(WINDOW) private window: Window,
             private _apollo:Apollo,
             private _snackBar: MatSnackBar,
             private _cookieService: CookieService) { }

  ngOnInit() {
    if (!this._activeRouteSUB) {
      this._activeRouteSUB = this._activeRoute.paramMap.subscribe((params) => {
        this.eventId = params.get('eventId');
        this._getEventData();
      });
    }
    // Check for cookie acceptance
    if (!this._cookieService.check('cookiesAccepted')) {
      let cookieWarning = this._snackBar.open('Wir brauchen 🍪!!', 'OK');
      cookieWarning.onAction().toPromise()
        .then(() => {
          this._cookieService.set('cookiesAccepted', 'Yeess Boiiiiiiiii');
        })
        .catch((err) => {
          console.error(err);
          this.slide = 0;
        })
    }
  }

  private _getEventData(){
    this._apollo.query({
      query: gql `
        query gql($eventId: String!) {
          event(input: { eventId: $eventId }) {
            eventId
            title
            users {
              id
            }
            optimalDate {
              id
              startDate
              endDate
              users {
                id
              }
            }
            optimalPlatform {
              id
              title
              users {
                id
              }
            }
          }
        }
        `,
        variables: {
          eventId: this.eventId
        }
    })
    .subscribe(({data}:any) => {
      this.event = data.event;
      console.log('Incoming Data:', this.event);
    }, (err) => {
      this.slide = 0;
      this.idError = true;
      console.error(err);
    })
  }

  convertDate(startDate: string, endDate: string): string {
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    return sDate.toLocaleDateString() + ' \t ' + this._appendZeros(sDate.getHours())  + ':' + 
    this._appendZeros(sDate.getMinutes()) +
    ' - ' + this._appendZeros(eDate.getHours())+ ':' + this._appendZeros(eDate.getMinutes()) + '';
  }

  private _appendZeros(input: number): string{
    if (input < 10) {
      return '0' + input;
    } else {
      return input.toString();
    }
  }

  retry(): void  {
    this.slide = 1;
  }
  
  copyLink(): void {
    const el = document.createElement('textarea');
    el.value = 
    this.window.location.protocol + '//' + this.window.location.hostname + ':'
    + this.window.location.port + '/' + this.event.eventId;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    this._snackBar.open('In Zwischenablage kopiert.', 'Schließen', { duration: 3000 });
  }

}
