-- Client page avatar, used to make the Piano Editoriale preview look like a
-- real Instagram post (avatar + handle above the image), shown to the client.

alter table pages add column if not exists avatar_path text;
