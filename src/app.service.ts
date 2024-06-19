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

  async query(data: string): Promise<any> {
    const API_TOKEN = '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';

    const response = await fetch(
      'https://api-inference.huggingface.co/models/gpt2',
      {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
        method: 'POST',
        body: JSON.stringify(data),
      },
    );

    const result = response.json();

    return result;
  }

  async visualQuestionAnswering() {
    const inference = new HfInference('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');
    const vqa = inference.endpoint(
      'https://g8a7fnx4995stodw.us-east-1.aws.endpoints.huggingface.cloud',
    );

    const imageUrl =
      'https://boda-bucket.s3.ap-northeast-2.amazonaws.com/uploads/cat.png';
    const imageres = await fetch(imageUrl);
    const imageBlob = await imageres.blob();

    const response = await vqa.visualQuestionAnswering({
      inputs: {
        question: 'What is in the photo?',
        image: imageBlob,
      },
    });

    return response;
  }

  async korToEng(questionInKor: string) {
    async function query(questionInKor) {
      try {
        const response = await fetch(
          'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
          {
            headers: {
              Authorization: 'Bearer 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',
              'Content-Type': 'application/json',
            },
            method: 'POST',
            body: JSON.stringify(questionInKor),
          },
        );

        // Check if the response is ok (status in the range 200-299)
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `HTTP error! status: ${response.status}, body: ${errorText}`,
          );
        }

        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Error during fetching or parsing:', error);
        throw error;
      }
    }

    return await query({
      inputs: `Translate into English in a sentence: '${questionInKor}'. Respond with only "The Answer is: " followed by the translation and nothing else.' 
      `,
    })
      .then((response) => {
        // console.log(JSON.stringify(response));
        return response;
      })
      .catch((error) => {
        console.error('Query failed:', error);
      });
  }

  async engToKor(questionInEng: string) {
    async function query(questionInEng) {
      try {
        const response = await fetch(
          'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
          {
            headers: {
              Authorization: 'Bearer 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',
              'Content-Type': 'application/json',
            },
            method: 'POST',
            body: JSON.stringify(questionInEng),
          },
        );

        // Check if the response is ok (status in the range 200-299)
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `HTTP error! status: ${response.status}, body: ${errorText}`,
          );
        }

        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Error during fetching or parsing:', error);
        throw error;
      }
    }

    return await query({
      inputs: `Translate into Korean: "${questionInEng}". Respond with only "The Answer is: " followed by the translation and nothing else.`,
    })
      .then((response) => {
        console.log(JSON.stringify(response));
        return response;
      })
      .catch((error) => {
        console.error('Query failed:', error);
      });
  }

  async getHello(question: string): Promise<string> {
    const questionInKor = `${question}`;
    // 한글 -> 영어
    const korText = await this.korToEng(questionInKor);

    const answerPrefix = 'The Answer is: ';
    const generatedText = korText[0].generated_text;
    const answerIndex =
      generatedText.lastIndexOf(answerPrefix) + answerPrefix.length;
    const finalAnswer = generatedText.substring(answerIndex).trim();

    // 따옴표 사이의 텍스트를 추출하는 부분
    const startQuoteIndex = finalAnswer.indexOf('"') + 1;
    const endQuoteIndex = finalAnswer.lastIndexOf('"');
    const result = finalAnswer.substring(startQuoteIndex, endQuoteIndex);
    console.log(result);

    // const text = await this.engToKor(questionInEng);
    // console.log(text);
    // const answerPrefix = 'The Answer is: ';
    // const generatedText = text[0].generated_text;
    // const answerIndex =
    //   generatedText.lastIndexOf(answerPrefix) + answerPrefix.length;
    // const finalAnswer = generatedText.substring(answerIndex).trim();

    // console.log('finalAnswer', finalAnswer);

    // const res = await this.visualQuestionAnswering();
    // console.log('answer', JSON.stringify(res));

    // TODO: 영어 -> 한글
    return korText;
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
      // TODO: captioning 연결

      return { imgUrl: result.Location, message: 'caption 결과' };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
}
