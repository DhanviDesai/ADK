def handler(self,connection,a):
    try:
        while True:
            data = connection.recv(BYTE_SIZE)
            for connection in self.connection:
                if data and data.decode('utf-8')[0].lower() == 'q':
                    self.disconnect(connection,a)
                    return
                elif data and data.decode('utf-8') == REQUEST_STRING:
                    print("-"*21+"UPLOADING"+"-"*21)
                    connection.send(self.msg)
    except Exception as e:
        sys.exit()
