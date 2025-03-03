import { PartialType } from '@nestjs/swagger';
import { CreateHotSearchDto } from './create-hot-search.dto';

export class UpdateHotSearchDto extends PartialType(CreateHotSearchDto) {}
