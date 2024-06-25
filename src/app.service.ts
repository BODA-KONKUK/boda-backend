import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { HfInference } from '@huggingface/inference';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mimeTypes from 'mime-types';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';

@Injectable()
export class AppService {
  // @InjectRepository(Board)
  // private boardRepository: Repository<Board>;
  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {
    this.s3Client = new S3Client({
      region: 'ap-northeast-2',
      credentials: {
        accessKeyId: this.config.get<string>('ACCESS_KEY_ID'),
        secretAccessKey: this.config.get<string>('SECRET_ACCESS_KEY'),
      },
    });
  }

  private s3Client: S3Client;

  async visualQuestionAnswering(imageUrl, question): Promise<any> {
    const inference = new HfInference('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');
    const vqa = inference.endpoint(
      'https://pmv2sq2r47wtie5t.us-east-1.aws.endpoints.huggingface.cloud',
    );

    const imageres = await fetch(imageUrl);
    const imageBlob = await imageres.blob();
    console.log(question);

    const response = await vqa.visualQuestionAnswering({
      inputs: {
        question: question,
        image: imageBlob,
      },
    });

    return response;
  }

  async captioning(imageUrl: string) {
    // const API_TOKEN = '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';

    // const imageres = await fetch(imageUrl);
    // const imageBlob = await imageres.blob();

    // async function query(imageBlob) {
    //   const response = await fetch(
    //     'https://api-inference.huggingface.co/models/nlpconnect/vit-gpt2-image-captioning',
    //     {
    //       headers: {
    //         Authorization: `Bearer ${API_TOKEN}`,
    //         'Content-Type': 'application/json',
    //       },
    //       method: 'POST',
    //       body: imageBlob,
    //     },
    //   );

    //   const result = await response.json();
    //   return result;
    // }

    // return query(imageBlob).then((response) => {
    //   const result = response[0];
    //   console.log('responseresult', response[0]);

    //   return result.generated_text;
    // });

    const inference = new HfInference('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');
    const capModel = inference.endpoint(
      'https://ygy9i8jr7xhty9ws.us-east-1.aws.endpoints.huggingface.cloud',
    );

    const imageres = await fetch(imageUrl);
    const imageBlob = await imageres.blob();

    const response = await capModel.request(
      {
        data: imageBlob,
      },
      {
        taskHint: 'image-to-text',
      },
    );

    console.log('response', response);

    return response;
  }

  extractTranslatedText(response) {
    const startMarker = "'";
    const endMarker = "'\n";
    const startIndex = response.indexOf(startMarker) + startMarker.length;
    const endIndex = response.indexOf(endMarker, startIndex);
    return response.substring(startIndex, endIndex);
  }

  async vqa(imgUrl: string, question: string): Promise<string> {
    // const questionInKor = `${question}`;
    // // 한글 -> 영어
    // const engText = await this.korToEng(questionInKor);

    // const answerPrefix1 = 'The Answer is: ';
    // const generatedText1 = engText[0].generated_text;
    // const answerIndex1 =
    //   generatedText1.lastIndexOf(answerPrefix1) + answerPrefix1.length;
    // const finalAnswer1 = generatedText1.substring(answerIndex1).trim();

    // // 따옴표 사이의 텍스트를 추출하는 부분
    // const startQuoteIndex1 = finalAnswer1.indexOf('"') + 1;
    // const endQuoteIndex1 = finalAnswer1.lastIndexOf('"');
    // const engQuestion = finalAnswer1.substring(
    //   startQuoteIndex1,
    //   endQuoteIndex1,
    // );
    // console.log(engQuestion);

    const res = await this.visualQuestionAnswering(imgUrl, question);
    console.log('answer', JSON.stringify(res));

    // const answerText = res.answer;
    // const startQuoteIndex = answerText.indexOf('"') + 1;
    // const endQuoteIndex = answerText.indexOf('"', startQuoteIndex);
    // const result = answerText.substring(startQuoteIndex, endQuoteIndex);

    // console.log('result', result);

    // const korAnswer = await this.engToKor(result);
    // console.log(korAnswer);
    // const answerPrefix = 'The Answer is: ';
    // const generatedText = korAnswer[0].generated_text;
    // const answerIndex =
    //   generatedText.lastIndexOf(answerPrefix) + answerPrefix.length;
    // const finalAnswer = generatedText.substring(answerIndex).trim();

    // console.log('finalAnswer', finalAnswer);

    return res.answer.replace('\n', '');
  }

  async fileUpload(file: Express.Multer.File) {
    const contentType =
      mimeTypes.lookup(file.originalname) || 'application/octet-stream';

    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: 'boda-bucket', // S3 버킷 이름
        Key: `uploads/${file.originalname}`, // 파일을 저장할 S3 내의 경로 및 파일 이름
        Body: file.buffer, // 파일 데이터
        ContentType: contentType, // ContentType 설정
      },
    });

    try {
      const result = await upload.done();
      // console.log('File uploaded:', result.Location);
      const captioningText = await this.captioning(result.Location);
      console.log(captioningText);

      return {
        imgUrl: result.Location,
        message: (captioningText as string).replace('\n', ''),
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
}
