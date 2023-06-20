import {LitElement, html, css, CSSResultGroup} from 'lit';
import { property } from "lit/decorators.js";
import {map} from 'lit/directives/map.js';

class PolrBirthdayCard extends LitElement {
  @property() _config : any;
  @property() _hass : any;
  @property() _events : Array<BirthdayEvent>;

  static getConfigElement() {
    // return document.createElement("polr-birthday-card-editor");
  }

  static getStubConfig() {
    return {
      entity_id: "calendar.birthdays",
      days: 30,
      max: 5
    };
  }

  setConfig(config : any) {
    if (!config["entity_id"]) {
      throw new Error("entity_id must be specified");
    }

    this._config = JSON.parse(JSON.stringify(config));

    if (!config["days"]) {
      this._config["days"] = 90;
    }

  }

  set hass(hass : any) {
    this._hass = hass;

    this
    .getEvents(hass)
    .then(events => 
      !this._config["max"]
      ? this._events = events
      : this._events = events.slice(0, this._config["max"]))
    .catch(error => console.log('error', error))
  }

  async getEvents(hass : any) {
    try {
      var startDate = new Date();
      var start = startDate.toISOString().slice(0, 10);

      var endDate = new Date();
      endDate.setDate(endDate.getDate() + this._config["days"]);
      var end = endDate.toISOString().slice(0, 10);

      var url = `calendars/${this._config["entity_id"]}?start=${start}&end=${end}`;
      var data = await hass.callApi('GET', url);
      var eventDates = [];
      data.forEach(item => {
        eventDates.push(new BirthdayEvent(item));
      });

      return (eventDates);
    } catch (error) {
      throw (error);
    }
  }

  render() {
    return html`
      <ha-card header="${this._config["title"]}">
        <div class="card-content">
          ${map(this._events, (i) => html`
            <div class="card ${i.today()?'today':''}">
              <div class="circle">
                  <div class="month">${ i.getMonth() }</div>
                  <div class="day">${ i.getDay() }</div>
              </div>
              <div class="main">
                <div class="name">
                  ${i.getName()}
                </div>
                <div class="type">
                  ${ i.getType() }
                </div>
              </div>
            </div>
          `)}
        </div>
      </ha-card>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      .card {
        display: flex;
        gap: 10px;
        align-items: center;
        padding: 10px 0;
        margin-bottom: 10px;
        border-radius: 10px;
      }

      .circle {
        background-color: var(
          --ha-card-border-color,
          var(--divider-color, #e0e0e0)
        );
        border-radius: 50%;
        width: 40px;
        height: 40px;
        text-align: center;
        padding: 10px;
      }

      .today {
        background-color: green;
      }

      .month {
        font-size: 0.75em;
        text-transform: uppercase;
        font-weight: bold;
      }
      
      .day {
        font-size: 1.25em;
        font-weight: bold;
      }

      .name {
        font-weight: bold;
      }

      .type {
        font-size: 0.8em;
        text-transform: uppercase;
      }
    `;
  }
}

class PolrBirthdayCardEditor extends LitElement {
  
  setConfig(config:any) {
  }
  
  render() {
    return html`
    
    `;
  }
}

class BirthdayEvent {
  name: string;
  eventDate: Date;
  type: string;
  current : boolean;
  raw : any;

  constructor(data : any) {
    this.type = this.findType(data["summary"]);
    this.name = this.findName(data["summary"]);
    this.eventDate = this.findDate(data["start"]["date"]);
    this.current = this.findCurrent();

    this.raw = data;
  }

  private findDate(data : string) {
    return new Date(data + "T00:00:00");
  }

  private findCurrent() {
    var today = new Date();
    return (this.eventDate.getFullYear() === today.getFullYear()
        && this.eventDate.getMonth() === today.getMonth()
        && this.eventDate.getDate() === today.getDate())
  }

  private findName(data : string) {
    if(data.includes("'"))
      return data.substring(0, data.indexOf("'"));
    else
      return "Your"
  }

  private findType(data: string) {
    if (data.includes("birthday")) {
      return "🎂 Birthday";
    }
     
    if (data.includes("anniversary")) {
      return "💍 Anniversay";
    }

    return "Unknown";
  }

  getFormattedDate() {
    return this.eventDate.toISOString().split('T')[0];
  }

  getName() {
    return this.name;
  }

  getMonth() {
    return this.eventDate.toLocaleString('en-US', { month: 'short' });
  }

  getDay() {
    return this.eventDate.getDate();
  }

  getType() {
    return this.type;
  }

  today() { 
    return this.current;
  }
}

customElements.define("polr-birthday-card", PolrBirthdayCard);
customElements.define("polr-birthday-card-editor", PolrBirthdayCardEditor);

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'polr-birthday-card',
  name: 'POLR Birthday Card',
  description: 'A template custom card for you to create something awesome',
  preview: true
});
