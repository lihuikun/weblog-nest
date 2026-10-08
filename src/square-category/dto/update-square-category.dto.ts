import { PartialType } from '@nestjs/swagger';
import { CreateSquareCategoryDto } from './create-square-category.dto';

export class UpdateSquareCategoryDto extends PartialType(CreateSquareCategoryDto) {}
