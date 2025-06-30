export class Shape {
  id: string;
  coordinates: any[];

  constructor(id: string, coordinates: any[]) {
    this.id = id;
    this.coordinates = coordinates;
  }

  update(coordinates: any[]): void {
    this.coordinates = coordinates;
  }
}
