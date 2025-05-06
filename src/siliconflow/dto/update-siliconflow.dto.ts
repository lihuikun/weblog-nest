import { PartialType } from '@nestjs/swagger';
import { CreateSiliconflowDto } from './create-siliconflow.dto';

export class UpdateSiliconflowDto extends PartialType(CreateSiliconflowDto) {}
