import "reflect-metadata";
import { Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne, ManyToMany, OneToMany, JoinTable } from "typeorm";

class Meta {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({default: ''})
    desc: string;

    @CreateDateColumn()
    dateCreated: Date;

    @UpdateDateColumn()
    dateUpdated: Date;
}

@Entity()
export class Category extends Meta{
    @ManyToMany(type => Book, book => book.cateList)
    bookList: Book[];

    @Column({default: ''})
    name: string;
}

@Entity()
export class Website extends Meta{
    @Column()
    uri: string;

    @OneToMany(type => Book, book => book.website)
    bookList: Book[];

    @ManyToMany(type => Writer, writer => writer.websiteList)
    writerList: Writer[];
}

@Entity()
export class Writer extends Meta{
    @ManyToMany(type => Website, website => website.writerList)
    @JoinTable()
    websiteList: Array<Website>;

    @OneToMany(type => Book, book => book.writer)
    bookList: Book[];

    @Column({default: ''})
    name: string;
}

@Entity() 
export class Book extends Meta{
    @Column({default: ''})
    title: string;

    @Column({default: ''})
    commit: string;

    @Column({default: ''})
    name: string;

    @Column({default: ''})
    errMsg: string; 

    @Column({default: false})
    downloaded: boolean;

    @Column({default: 0})
    openCount: number;

    @Column({default: false})
    recycled: boolean;

    @Column({default: false})
    indexed: boolean;

    @ManyToMany(type => Category, category => category.bookList)
    @JoinTable()
    cateList: Category[];

    @ManyToOne(type => Writer, writer => writer.bookList)
    writer: Writer;

    @ManyToOne(type => Website, website => website.bookList)
    website: Website;

    @OneToMany(type=> ReadingRecord, record => record.book)
    @JoinTable()
    recordList: ReadingRecord[];
}

@Entity() 
export class ReadingRecord extends Meta {
    @Column()
    path: string;

    @ManyToOne(type => Book, book => book.recordList)
    book: Book;
}

