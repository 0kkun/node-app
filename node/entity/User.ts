import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class User {

  constructor(firstName: string, lastName: string, age: number) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.age = age;
  }

  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  age: number;
}