import { Group } from "@/models/Group";
import { Subgroup } from "@/models/Subgroup";
import { Employee } from "@/models/Employee";
import { Shift } from "@/models/Shift";

export class WorkContextIO {
  public date = "";
  public employees: Employee[] = [];
  public groups: Group[] = [];
  public subgroups: Subgroup[] = [];
  public availableCars = 0;
  public shifts: Shift[] = [];
}
